# Kapp Dashboard

## How to run this project.

```
# before start, copy .env.sample to .env, then edit .env

npm install
npm run start
```

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
