
SHARNESS_LIB="lib/sharness/sharness.sh"

. "$SHARNESS_LIB" || {
  echo >&2 "Cannot source: $SHARNESS_LIB"
  echo >&2 "Please check Sharness installation."
  exit 1
}

# Quote arguments for sh eval
shellquote() {
	_space=''
	for _arg
	do
		# On Mac OS, sed adds a newline character.
		# With a printf wrapper the extra newline is removed.
		printf "$_space'%s'" "$(printf "%s" "$_arg" | sed -e "s/'/'\\\\''/g;")"
		_space=' '
	done
	printf '\n'
}

# Echo the args, run the cmd, and then also fail,
# making sure a test case fails.
test_fsh() {
    echo "> $@"
    eval $(shellquote "$@")
    echo ""
    false
}

# Same as sharness' test_cmp but using test_fsh (to see the output).
# We have to do it twice, so the first diff output doesn't show unless it's
# broken.
test_cmp() {
	diff -q "$@" >/dev/null || test_fsh diff -u "$@"
}

test_get_pgid_from_pid() {
  awk '{print $5}' < /proc/$1/stat
}
