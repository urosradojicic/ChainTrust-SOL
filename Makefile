# ChainTrust — convenience targets that mirror `npm run` scripts.
#
# Why a Makefile when this is a Node project? Two reasons:
#   1. Reviewers from non-Node backgrounds (Solana validators, infra
#      engineers) recognize `make demo` instantly.
#   2. The `verify` target is the one-shot pre-PR check; having a single
#      tab-completable command beats remembering five npm script names.

.PHONY: install dev demo build test typecheck lint verify secret-scan sbom favicons docs help

.DEFAULT_GOAL := help

help:  ## Show this help (default target)
	@echo "ChainTrust — common dev tasks"
	@echo ""
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Tip: 'make demo' is the one-line happy path for reviewers."

install:  ## Install dependencies (legacy peer deps — see CONTRIBUTING.md)
	npm install --legacy-peer-deps

dev:  ## Run dev server on :8080
	npm run dev

demo: install  ## One-line happy path: install deps + start dev server
	@echo ""
	@echo "Open http://localhost:8080/testnet-demo and connect Phantom on Devnet."
	@echo "Login creds for the screener: investor@chainmetrics.io / investor1"
	@echo ""
	npm run dev

build:  ## Production bundle
	npm run build

test:  ## Run vitest (74 cases)
	npm test -- --run

typecheck:  ## tsc --noEmit
	npm run typecheck

lint:  ## ESLint
	npm run lint

secret-scan:  ## Scan staged files for credentials
	npm run secret-scan

sbom:  ## Generate sbom.cyclonedx.json from package-lock.json
	npm run sbom

favicons:  ## Re-render the favicon set from brand/logomark.svg
	node scripts/generate-favicons.mjs

verify:  ## Full pre-PR check: secret-scan + lint + typecheck + test
	npm run verify

docs:  ## Open the docs index in your browser (best-effort)
	@command -v xdg-open >/dev/null && xdg-open docs/README.md || \
	  command -v open >/dev/null && open docs/README.md || \
	  echo "Open docs/README.md in your editor or browser."
