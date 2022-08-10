# Build Mendix widgets and release the mpk's

## Features

- Build and release all widgets in the monorepo
- Define a custom version (for major/minor updates) or let the action decide the new version tag

## Usage

An example of the action.yml file:

```yml
name: Publish packages on changed
on:
  push:
    branches:
      - main

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: VercammenG/mendix-widget-build-action-monorepo@main
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          author_name: app-services-release-bot
          identify_widgets_folders: -widgets
          release_version: v0.1.0
```

#### Creating a major/minor version update

To set the new tag to a new major/minor update you can update the _release_version_ in the action.yml file.

**WARNING**
The version tag needs to be unique. The user needs to define a version that does not yet exist or the action won't be able to create a release.

## How it works

You build or patch your widget, locally you lint and test it. If you are happy that there are no errors, commit your changes.

When the pr is merged the action will do the following things:

- Build all widgets
- Push a tag to the repo `vx.y.z` where z is incremented based on the last tag if no major or minor version change defined in the action.yml
- Place all mpk files of the widgets in the newly created release

### Internal steps

---

- Loop over all folders in `packages_folder` and search the folder containing the Mendix widgets (check if the folder name contains `identify_widgets_folders`)

- Builds a helper object with all paths it will need

- Reads the package's `package.json`

  - Saves package name and version

- Runs `npm install`

- Runs `npm build` and builds the package

- Gets all tags on the repo in Github

- Searches the most recent tag and checks if there are no major/minor version updates

  - No major/minor update => patch incremented with 1
  - Major/minor update => use the user defined version from the action.yml file

- Creates a release with the new tag

- Uploads everything in the build folders to the release
