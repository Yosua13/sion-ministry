package objectstore

import (
	"context"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"backend/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

var ErrNotConfigured = errors.New("object storage is not configured")

var checksumPattern = regexp.MustCompile(`^[a-f0-9]{64}$`)

type PresignInput struct {
	ContentType string `json:"contentType"`
	Size        int64  `json:"size"`
	SHA256      string `json:"sha256"`
}

type PresignedRequest struct {
	ObjectKey string      `json:"objectKey"`
	URL       string      `json:"url"`
	Method    string      `json:"method"`
	Headers   http.Header `json:"headers"`
	ExpiresAt time.Time   `json:"expiresAt"`
}

type Presigner interface {
	PresignUpload(ctx context.Context, input PresignInput) (*PresignedRequest, error)
	PresignDownload(ctx context.Context, objectKey string) (*PresignedRequest, error)
}

type s3Presigner struct {
	client    *s3.PresignClient
	bucket    string
	prefix    string
	expiresIn time.Duration
}

func NewPresigner(ctx context.Context, cfg *config.Config) (Presigner, error) {
	if cfg.S3Bucket == "" {
		return nil, nil
	}
	awsCfg, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithRegion(cfg.S3Region))
	if err != nil {
		return nil, fmt.Errorf("load S3 configuration: %w", err)
	}
	client := s3.NewFromConfig(awsCfg, func(options *s3.Options) {
		options.UsePathStyle = cfg.S3UsePathStyle
		if cfg.S3Endpoint != "" {
			options.BaseEndpoint = aws.String(cfg.S3Endpoint)
		}
	})
	return &s3Presigner{client: s3.NewPresignClient(client), bucket: cfg.S3Bucket, prefix: cfg.S3Prefix, expiresIn: cfg.SignedURLTTL}, nil
}

func ValidateInput(input PresignInput) (string, error) {
	contentType := strings.ToLower(strings.TrimSpace(input.ContentType))
	extension, supported := map[string]string{"image/jpeg": "jpg", "image/png": "png"}[contentType]
	if !supported {
		return "", errors.New("contentType harus image/jpeg atau image/png")
	}
	if input.Size < 1 || input.Size > 5<<20 {
		return "", errors.New("size harus antara 1 byte dan 5 MB")
	}
	input.SHA256 = strings.ToLower(strings.TrimSpace(input.SHA256))
	if !checksumPattern.MatchString(input.SHA256) {
		return "", errors.New("sha256 harus berupa checksum SHA-256 heksadesimal")
	}
	return extension, nil
}

func (s *s3Presigner) PresignUpload(ctx context.Context, input PresignInput) (*PresignedRequest, error) {
	extension, err := ValidateInput(input)
	if err != nil {
		return nil, err
	}
	objectKey := strings.Trim(s.prefix+"/"+input.SHA256+"."+extension, "/")
	request, err := s.client.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:               aws.String(s.bucket),
		Key:                  aws.String(objectKey),
		ContentType:          aws.String(input.ContentType),
		ChecksumSHA256:       aws.String(checksumBase64(input.SHA256)),
		ServerSideEncryption: types.ServerSideEncryptionAes256,
		Metadata:             map[string]string{"sha256": strings.ToLower(input.SHA256)},
	}, func(options *s3.PresignOptions) { options.Expires = s.expiresIn })
	if err != nil {
		return nil, fmt.Errorf("presign S3 upload: %w", err)
	}
	return &PresignedRequest{ObjectKey: objectKey, URL: request.URL, Method: request.Method, Headers: request.SignedHeader, ExpiresAt: time.Now().Add(s.expiresIn)}, nil
}

func (s *s3Presigner) PresignDownload(ctx context.Context, objectKey string) (*PresignedRequest, error) {
	objectKey = strings.Trim(strings.TrimSpace(objectKey), "/")
	if objectKey == "" || strings.Contains(objectKey, "..") || !strings.HasPrefix(objectKey, strings.Trim(s.prefix, "/")+"/") {
		return nil, errors.New("object key tidak valid")
	}
	request, err := s.client.PresignGetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(objectKey)}, func(options *s3.PresignOptions) { options.Expires = s.expiresIn })
	if err != nil {
		return nil, fmt.Errorf("presign S3 download: %w", err)
	}
	return &PresignedRequest{ObjectKey: objectKey, URL: request.URL, Method: request.Method, Headers: request.SignedHeader, ExpiresAt: time.Now().Add(s.expiresIn)}, nil
}

func checksumBase64(hexChecksum string) string {
	decoded, _ := hex.DecodeString(hexChecksum)
	return base64.StdEncoding.EncodeToString(decoded)
}
