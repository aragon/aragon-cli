# Run tests

SHELL_PATH ?= $(SHELL)
SHELL_PATH_SQ = $(subst ','\'',$(SHELL_PATH))
RM ?= rm -f
PROVE ?= prove
LIBDIR = lib
SHARNESSDIR = sharness
AGGREGATE_SCRIPT ?= $(LIBDIR)/$(SHARNESSDIR)/aggregate-results.sh
DEFAULT_TEST_TARGET ?= test

T = $(sort $(wildcard *.t))

all: $(DEFAULT_TEST_TARGET)

test: pre-clean aggregate-results-and-cleanup

$(T): sharness

	@echo "*** $@ ***"; '$(SHELL_PATH_SQ)' $@ $(TEST_OPTS)

pre-clean:
	@echo "*** $@ ***"
	$(RM) -r test-results

clean:
	@echo "*** $@ ***"
	$(RM) -r test-results

aggregate-results-and-cleanup: $(T) aggregate-results clean

aggregate-results:
	@echo "*** $@ ***"
	@for f in test-results/*.counts; do \
		echo "$$f"; \
	done | '$(SHELL_PATH_SQ)' '$(AGGREGATE_SCRIPT)'

sharness:
	@echo "*** checking $@ ***"
	lib/install-sharness.sh

prove: clean
	@echo "*** prove ***"; $(PROVE) --exec '$(SHELL_PATH_SQ)' $(PROVE_OPTS) $(T) :: $(TEST_OPTS)
	$(MAKE) clean-prove-cache

clean-prove-cache:
	$(RM) .prove

.PHONY: all test prove $(T) pre-clean clean sharness
.PHONY: aggregate-results-and-cleanup aggregate-results
