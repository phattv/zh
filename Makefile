BUN  ?= $(shell which bun)
NODE ?= $(shell which node)

.DEFAULT_GOAL := run

.PHONY: run build build-hanzi install missing \
        data-download data-parse data-enrich data-generate data-pipeline data-clean data-clean-all \
        enrich-learn generate-enrichments learn-pipeline

run:
	$(BUN) run dev

build:
	$(BUN) run build

build-hanzi:
	$(BUN) run build:hanzi

install:
	$(BUN) install

# ── Missing words ─────────────────────────────────────────────────────────────

missing:
	@if [ -z "$(word)" ]; then \
		echo "Usage: make missing word=撸串"; \
		exit 1; \
	fi
	$(NODE) --env-file=.env.local scripts/add-missing-word.mjs "$(word)"

# ── Data pipeline ─────────────────────────────────────────────────────────────

data-download:
	$(NODE) scripts/download-hsk.mjs

data-parse:
	$(NODE) scripts/parse-hsk.mjs

data-enrich:
	@if [ -z "$(ANTHROPIC_API_KEY)" ]; then \
		echo "Error: ANTHROPIC_API_KEY is not set"; \
		echo "Usage: make data-enrich ANTHROPIC_API_KEY=sk-ant-..."; \
		exit 1; \
	fi
	$(NODE) scripts/enrich-words.mjs

data-generate:
	$(NODE) scripts/generate-words-ts.mjs

# Run the full pipeline (download → parse → enrich → generate)
data-pipeline:
	@if [ -z "$(ANTHROPIC_API_KEY)" ]; then \
		echo "Error: ANTHROPIC_API_KEY is not set"; \
		echo "Usage: make data-pipeline ANTHROPIC_API_KEY=sk-ant-..."; \
		exit 1; \
	fi
	$(MAKE) data-download
	$(MAKE) data-parse
	$(MAKE) data-enrich ANTHROPIC_API_KEY=$(ANTHROPIC_API_KEY)
	$(MAKE) data-generate

# Delete intermediate files to force a full re-run (keeps downloaded source txt files)
data-clean:
	rm -f scripts/data/hsk-base.json scripts/data/hsk-enriched.json

# Delete everything including downloaded source files
data-clean-all:
	rm -f scripts/data/hsk*.txt scripts/data/hsk-base.json scripts/data/hsk-enriched.json

# ── Learn enrichment pipeline ──────────────────────────────────────────────────

enrich-learn:
	$(NODE) --env-file=.env.local scripts/enrich-learn.mjs

generate-enrichments:
	$(NODE) scripts/generate-enrichments-ts.mjs

# Run both steps: enrich → generate
learn-pipeline:
	$(MAKE) enrich-learn
	$(MAKE) generate-enrichments