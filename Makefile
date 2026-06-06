BUN ?= $(shell which bun)

.DEFAULT_GOAL := run

.PHONY: run build build-hanzi install
run:
	$(BUN) run dev

build:
	$(BUN) run build

build-hanzi:
	$(BUN) run build:hanzi

install:
	$(BUN) install