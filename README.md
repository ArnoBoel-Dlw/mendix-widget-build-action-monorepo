# Build a Mendix widgets and release the mpk

## Features

- Build the widget in the given folder
- **COMING SOON**: automatic release of the mpk to sharepoint

## Usage

An example of the publish job in the `action.yml` file:

```yml
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ArnoBoel-Dlw/mendix-widget-build-action-monorepo@main
       with:
          widget-folder: ${{ widget-folder }}
```

For this to work you would first need a job that determines all folders with widgets that have changed.
Then you would loop over all the folders and run this action for each folder that contains an updated widget.

## How it works

You build or patch your widget, locally you lint and test it. If you are happy that there are no errors, commit your changes.

When the pr is merged the action will do the following things:

- Run npm install
- Run npm run build to build the widget
- **COMING SOON**: publish mpk on sharepoint

### Internal steps

---

1. Builds a helper object with all paths it will need

2. Reads the package's `package.json`

3. Saves package name and version

4. Runs `npm install`

5. Runs `npm run build` and builds the package

6. **COMING SOON**: Publish mpk file to sharepoint
