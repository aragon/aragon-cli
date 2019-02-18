#!/bin/sh

test_description="Test aragon --help command"

. ./lib/test-lib.sh

TEXT_IT_SHOULD_INCLUDE="For more information, check out https://hack.aragon.org"

test_expect_success "'aragon --help' succeeds" '
  aragon --help
'

# pipe output to grep
test_expect_success "'aragon --help' output includes the hack website (1)" '
  aragon --help | grep "$TEXT_IT_SHOULD_INCLUDE"
'

# save output to file and use grep
test_expect_success "'aragon --help' output includes the hack website (2)" '
  aragon --help > actual &&
  grep "$TEXT_IT_SHOULD_INCLUDE" actual  
'

# save output to variable and use grep
test_expect_success "'aragon --help' output includes the hack website (3)" '
  OUTPUT=$(aragon --help) &&
  if [[ $OUTPUT =~ "$TEXT_IT_SHOULD_INCLUDE" ]];
    then return 0
    else return 1
  fi
'

test_done