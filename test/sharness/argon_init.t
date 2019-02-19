#!/bin/sh

test_description="Test aragon init command"

. ./lib/test-lib.sh

APP_NAME="test-app"

test_expect_success "'aragon init' succeeds" '
  test_might_fail aragon init "$APP_NAME"
'

# test arapp.json have app name updated
test_expect_success "arapp.json appName updated" '
  grep "\"appName\": \""$APP_NAME".*.aragonpm.eth" "$APP_NAME"/arapp.json 
'

#test if project already exists
test_expect_success "project already exists" '
  mkdir "$APP_NAME" &&
  test_must_fail aragon init "$APP_NAME" > output.txt &&
  grep "Project with name "$APP_NAME" already exists" output.txt
'

test_done