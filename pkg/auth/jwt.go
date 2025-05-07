package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/dgrijalva/jwt-go"
)

const (
	signingKey = "qrkjk#4#%35FSFJlja#4353KSFjH" // В продакшене должен быть в env
	tokenTTL   = 12 * time.Hour
)

type TokenClaims struct {
	jwt.StandardClaims
	UserId int    `json:"user_id"`
	Role   string `json:"role"`
}

func GenerateToken(userId int, role string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &TokenClaims{
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(tokenTTL).Unix(),
			IssuedAt:  time.Now().Unix(),
		},
		UserId: userId,
		Role:   role,
	})

	return token.SignedString([]byte(signingKey))
}

func ParseToken(accessToken string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(accessToken, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(signingKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok {
		return nil, errors.New("token claims are not of type *TokenClaims")
	}

	return claims, nil
}
