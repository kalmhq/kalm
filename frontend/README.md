# Kalm Dashboard

## How to run this project.

```
npm install
npm run start
```

## How to connect the backend services

1. Download the kalm project, Update master to latest.
2. Install [Docker](<[Docker](https://docs.docker.com/install/)>), [kubectl](<[kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)>), [kind](<[kind](https://github.com/kubernetes-sigs/kind)>) and [kustomize](<[kustomize](https://github.com/kubernetes-sigs/kustomize)>)
3. Enter kalm project root dir. Start kind cluster `kind create cluster --config hack/kind-config.yaml --image=kindest/node:v1.14.2`
4. After kind cluster is running. Create a new term session. Enter kalm project root dir. `make install`
5. Create a new term session. `kubectl proxy`.
6. Enter kalm-web project root dir. Start a proxy server. `node src/proxyServer/index.js`
7. Done

# Create React App Raw Content

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

# Storybook Design System

We will use storybook as a tool for designing assets for the KALM system. With storybook, we can integrate the design into the product faster and the frontend development process(design and engineering realization) can be organized according to components.

## features

- support material-ui custom theme
- support change background colors
- support change viewport
- support custom state and property
- support notes
- support mock url query
- support event emit

## how to run storybook

```
npm run storybook
```

## how to write a storybook for a components

There are two parts of the code that relate to storybook

- `frontend/.storybook`: all storybook configs here.
- `frontend/src/_stories`: all stories and story related widgets

### example for support parameters when preview storybook

please checkout `frontend/src/_stories/1-Button.stories.tsx` as a references.

### References:

- https://github.com/storybookjs/storybook/tree/master/addons/knobs
- https://github.com/storybookjs/storybook/tree/master/addons/viewport
- https://github.com/storybookjs/storybook/tree/master/addons/actions
- https://github.com/storybookjs/storybook/tree/master/addons/notes
- https://github.com/storybookjs/storybook/tree/master/addons/events
- https://github.com/storybookjs/storybook/tree/master/addons/queryparams
