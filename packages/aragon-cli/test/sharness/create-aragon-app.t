#!/bin/sh

test_description="Test create-aragon-app command"

. ./lib/test-lib.sh

APP_NAME="test-app"

test_expect_success "'create-aragon-app' succeeds" '
  test_might_fail npx create-aragon-app "$APP_NAME"
'

# test arapp.json have app name updated
test_expect_success "arapp.json appName updated" '
  echo 3 > result
  grep "\"appName\": \""$APP_NAME".*.aragonpm.eth" "$APP_NAME"/arapp.json -c > matchs
  test_cmp result matchs     
'

#test if project already exists
test_expect_success "project already exists" '
  test_must_fail npx create-aragon-app "$APP_NAME" > output.txt &&
  grep "Project with name "$APP_NAME" already exists" output.txt
'

test_done