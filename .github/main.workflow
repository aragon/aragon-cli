workflow "lint, test, build" {
  on = "push"
  resolves = ["build", "lint", "test"]
}

action "install" {
  uses = "actions/npm@master"
  args = "install --unsafe-perm"
}

action "build" {
  uses = "actions/npm@master"
  args = "run build"
  needs = ["install"]
}

action "lint" {
  uses = "actions/npm@master"
  args = "run lint"
  needs = ["install"]
}

action "test" {
  uses = "actions/npm@master"
  args = "run test"
  needs = ["install"]
}
