#!/bin/sh

test_description="Test aragon ipfs command"

. ./lib/test-lib.sh

test_launch_aragon_ipfs() {
  test_expect_success "'aragon ipfs' succeeds" '
    aragon ipfs > out_file 2> err_file &
    PID=$! &&
    echo "Process ID of the shell running this: $PID" &&
    PGID=$(test_get_pgid_from_pid $PID) &&
    echo "Process Group ID: $PGID"
  '
  # TODO Memory leak: tail never finishes
  # TODO process substitution is not portable, only works in bash
  test_expect_success "'aragon ipfs' says all good" '
    timeout 180 grep -m 1 "running" <(tail -f out_file)
  '
  # TODO test_curl_resp_http_code "http://localhost:5001/api/v0/version" "HTTP/1.1 200 OK"
  # TODO test check aragon-cache  "http://127.0.0.1:$API_PORT/ipfs/$HASH" "HTTP/1.1 200 OK"
}

test_kill_ipfs() {
  # -- is the default, which also means -15 or -TERM, sending the Termination signal
  # consider doing a graceful shutdown with -INT (-2) (interrupt - same as CTRL+C)
  # or using -KILL (-9) if a clean termination does not work
  test_expect_failure "'aragon ipfs' can be terminated" '
   kill -9 -$PGID
  '
}

test_launch_aragon_ipfs

test_kill_ipfs

test_done
