workflow "lint, test, build" {
  on = "push"
  resolves = ["build", "lint", "test", "test:e2e", "report-coverage"]
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
  args = "run test:coverage"
  needs = ["install"]
}

action "report-coverage" {
  uses = "actions/npm@master"
  args = "run report-coverage"
  needs = ["test"]
}

action "test:e2e" {
  uses = "actions/npm@master"
  args = "run test:e2e"
  needs = ["install"]
}
