package monitoring

import (
	"time"

	"github.com/getsentry/sentry-go"
)

func Init(dsn string, environment string) (func(), error) {
	if dsn == "" {
		return func() {}, nil
	}
	if err := sentry.Init(sentry.ClientOptions{
		Dsn:         dsn,
		Environment: environment,
	}); err != nil {
		return nil, err
	}
	return func() { sentry.Flush(2 * time.Second) }, nil
}

func CaptureError(err error, requestID string, path string) {
	if err == nil {
		return
	}
	sentry.WithScope(func(scope *sentry.Scope) {
		scope.SetTag("request_id", requestID)
		scope.SetTag("path", path)
		sentry.CaptureException(err)
	})
}
