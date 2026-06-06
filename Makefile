BUN ?= $(shell which bun)

.DEFAULT_GOAL := run

.PHONY: run build install
run:
	$(BUN) run dev

build:
	$(BUN) build

install:
	$(BUN) install