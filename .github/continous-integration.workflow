workflow "lint, test, build" {
  on = "push"
  resolves = ["build", "lint", "test"]
}

action "install" {
  uses = "actions/npm@master"
  args = "install"
}

action "prepare" {
  uses = "actions/npm@master"
  args = "run prepare"
  needs = ["install"]
}

action "build" {
  uses = "actions/npm@master"
  args = "run build"
  needs = ["prepare"]
}

action "link" {
  uses = "actions/npm@master"
  args = "run link"
  needs = ["build"]
}

action "lint" {
  uses = "actions/npm@master"
  args = "run lint"
  needs = ["prepare"]
}

action "test" {
  uses = "actions/npm@master"
  args = "run test"
  needs = ["link"]
}
