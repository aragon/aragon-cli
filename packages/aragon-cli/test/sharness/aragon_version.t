#!/bin/sh

test_description="Test aragon --version command"

. ./lib/test-lib.sh

EXPECTED_OUTPUT="5.3.3" 

test_expect_success "'aragon --version' succeeds" '
  aragon --version
'

# save outputs to files and compare
test_expect_success "'aragon --version' output looks good (1)" '
  aragon --version > actual &&
  echo $EXPECTED_OUTPUT > expected &&
  test_cmp expected actual
'

# save the output in a variable and compare
test_expect_success "'aragon --version' output looks good (2)" '
  OUTPUT=$(aragon --version) &&
  
  if [[ $OUTPUT == $EXPECTED_OUTPUT ]];
    then return 0
    else return 1
  fi
'

test_done