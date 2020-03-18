package handler

import "github.com/labstack/echo/v4"

func handlePing(c echo.Context) error {
	return c.String(200, "ok")
}
