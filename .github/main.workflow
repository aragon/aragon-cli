workflow "continuous-integration" {
  on = "push"
  resolves = ["build", "lint", "test", "test:e2e"]
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

action "test:e2e" {
  uses = "actions/npm@master"
  args = "run test:e2e"
  needs = ["install"]
}
