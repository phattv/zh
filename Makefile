BUN ?= $(shell which bun)

.DEFAULT_GOAL := run

.PHONY: run build build-hanzi install missing \
        db-download db-parse db-enrich db-generate db-pipeline db-clean db-clean-all

run:
	$(BUN) run dev

build:
	$(BUN) run build

build-hanzi:
	$(BUN) run build:hanzi

install:
	$(BUN) install

# ── Missing words ──────────────────────────────────────────────────────────────

missing:
	@if [ -z "$(word)" ]; then \
		echo "Usage: make missing word=撸串"; \
		exit 1; \
	fi
	$(BUN) scripts/missing_word/1_add_missing_word.ts "$(word)"

# ── Database pipeline ──────────────────────────────────────────────────────────

db-download:
	$(BUN) scripts/database/1_download_raw.ts

db-parse:
	$(BUN) scripts/database/2_concat_base.ts

db-enrich:
	$(BUN) scripts/database/3_enrich_word.ts

db-generate:
	$(BUN) scripts/database/4_generate_database.ts

# Run the full pipeline: download → parse → enrich → generate
db-pipeline:
	@echo ""
	@echo "════════════════════════════════════════"
	@echo "  DATABASE PIPELINE"
	@echo "  Started: $$(date '+%H:%M:%S')"
	@echo "════════════════════════════════════════"
	@echo ""
	@echo "── Step 1/4  Download raw HSK files ────"
	@_T=$$(date +%s); $(MAKE) --no-print-directory db-download; \
	  echo "   done in $$(( $$(date +%s) - $$_T ))s"
	@echo ""
	@echo "── Step 2/4  Parse → base.json ─────────"
	@_T=$$(date +%s); $(MAKE) --no-print-directory db-parse; \
	  echo "   done in $$(( $$(date +%s) - $$_T ))s"
	@echo ""
	@echo "── Step 3/4  Enrich (Claude Haiku) ─────"
	@echo "   This step is long — each batch logs progress."
	@_T=$$(date +%s); $(MAKE) --no-print-directory db-enrich; \
	  echo "   done in $$(( $$(date +%s) - $$_T ))s"
	@echo ""
	@echo "── Step 4/4  Generate src/database.ts ──"
	@_T=$$(date +%s); $(MAKE) --no-print-directory db-generate; \
	  echo "   done in $$(( $$(date +%s) - $$_T ))s"
	@echo ""
	@echo "════════════════════════════════════════"
	@echo "  DONE  Finished: $$(date '+%H:%M:%S')"
	@echo "════════════════════════════════════════"
	@echo ""

# Delete JSON intermediates (keeps source txt files)
db-clean:
	rm -f scripts/database/data/2_base.json scripts/database/data/3_enriched.json

# Delete everything including downloaded source files
db-clean-all:
	rm -f scripts/database/data/1_hsk*.txt scripts/database/data/2_base.json scripts/database/data/3_enriched.json
