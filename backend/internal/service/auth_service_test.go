package service

import "testing"

func TestArgon2PasswordHashRoundTrip(t *testing.T) {
	hash, err := hashPassword("password-yang-panjang-dan-aman")
	if err != nil {
		t.Fatalf("hashPassword: %v", err)
	}
	if valid, legacy := verifyPassword(hash, "password-yang-panjang-dan-aman"); !valid || legacy {
		t.Fatalf("Argon2id password was not accepted")
	}
	if valid, _ := verifyPassword(hash, "password-salah"); valid {
		t.Fatal("wrong password was accepted")
	}
}

func TestSessionTokenHashIsStableAndNotRawToken(t *testing.T) {
	const token = "token-rahasia-untuk-uji"
	if hashSessionToken(token) == token {
		t.Fatal("session token was not hashed")
	}
	if hashSessionToken(token) != hashSessionToken(token) {
		t.Fatal("session token hash is not stable")
	}
}
