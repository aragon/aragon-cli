workflow "lint, test, build" {
  on = "push"
  resolves = ["build", "lint", "test:unit", "test:e2e"]
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

action "test:unit" {
  uses = "actions/npm@master"
  args = "run test:unit:coverage"
  needs = ["install"]
}

action "test:e2e" {
  uses = "actions/npm@master"
  args = "run test:e2e"
  needs = ["install"]
}
