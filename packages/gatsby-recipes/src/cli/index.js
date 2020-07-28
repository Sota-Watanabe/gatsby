const React = require(`react`)
const { useState, useEffect } = require(`react`)
import SelectInput from "ink-select-input"
import { render, Box, Text, useInput, useApp } from "ink"
import Spinner from "ink-spinner"
import Link from "ink-link"
import MDX from "../components/mdx"
const hicat = require(`hicat`)
const { trackCli } = require(`gatsby-telemetry`)
import {
  useResource,
  useResourceByUUID,
  ResourceProvider,
} from "../renderer/resource-provider"
const {
  createClient,
  useMutation,
  useSubscription,
  Provider,
  defaultExchanges,
  subscriptionExchange,
} = require(`urql`)
const { SubscriptionClient } = require(`subscriptions-transport-ws`)
const fetch = require(`node-fetch`)
const ws = require(`ws`)
const semver = require(`semver`)
const remove = require(`unist-util-remove`)

const removeJsx = () => tree => {
  remove(tree, `export`, () => true)
  return tree
}

// Check for what version of React is loaded & warn if it's too low.
if (semver.lt(React.version, `16.8.0`)) {
  console.log(
    `Recipes works best with newer versions of React. Please file a bug report if you see this warning.`
  )
}

const WelcomeMessage = () => (
  <>
    <Box
      borderStyle="double"
      borderColor="magentaBright"
      padding={1}
      marginBottom={1}
      marginLeft={2}
      marginRight={2}
    >
      <Text>
        Thank you for trying the experimental version of Gatsby Recipes!
      </Text>
    </Box>
    <Div marginBottom={2} alignItems="center">
      <Text>
        Please ask questions, share your recipes, report bugs, and subscribe for
        updates in our umbrella issue at
        https://github.com/gatsbyjs/gatsby/issues/22991
      </Text>
    </Div>
  </>
)

const RecipesList = ({ setRecipe }) => {
  const items = [
    {
      label: `Add a custom ESLint config`,
      value: `eslint.mdx`,
    },
    {
      label: `Add Jest`,
      value: `jest.mdx`,
    },
    // Waiting on joi2graphql support for Joi.object().unknown()
    // with a JSON type.
    // {
    // label: "Automatically run Prettier on commits",
    // value: "prettier-git-hook.mdx",
    // },
    {
      label: `Add Gatsby Theme Blog`,
      value: `gatsby-theme-blog`,
    },
    {
      label: `Add Gatsby Theme Blog Core`,
      value: `gatsby-theme-blog-core`,
    },
    {
      label: `Add Gatsby Theme Notes`,
      value: `gatsby-theme-notes`,
    },
    {
      label: `Add persistent layout component with gatsby-plugin-layout`,
      value: `gatsby-plugin-layout`,
    },
    {
      label: `Add Theme UI`,
      value: `theme-ui.mdx`,
    },
    {
      label: `Add Emotion`,
      value: `emotion.mdx`,
    },
    {
      label: `Add support for MDX Pages`,
      value: `mdx-pages.mdx`,
    },
    {
      label: `Add support for MDX Pages with images`,
      value: `mdx-images.mdx`,
    },
    {
      label: `Add Styled Components`,
      value: `styled-components.mdx`,
    },
    {
      label: `Add Tailwind`,
      value: `tailwindcss.mdx`,
    },
    {
      label: `Add Sass`,
      value: `sass.mdx`,
    },
    {
      label: `Add Typescript`,
      value: `typescript.mdx`,
    },
    {
      label: `Add Cypress testing`,
      value: `cypress.mdx`,
    },
    {
      label: `Add animated page transition support`,
      value: `animated-page-transitions.mdx`,
    },
    {
      label: `Add plugins to make site a PWA`,
      value: `pwa.mdx`,
    },
    {
      label: `Add React Helmet`,
      value: `gatsby-plugin-react-helmet.mdx`,
    },
    {
      label: `Add GitHub Pages deployment with Travis CI`,
      value: `travis-deploy-github-pages.mdx`,
    },
    {
      label: `Add Headless WordPress integration`,
      value: `wordpress.mdx`,
    },
    {
      label: `Add Storybook - JavaScript`,
      value: `storybook-js.mdx`,
    },
    {
      label: `Add Storybook - TypeScript`,
      value: `storybook-ts.mdx`,
    },
    {
      label: `Add AVA`,
      value: `ava.mdx`,
    },
    {
      label: `Add Preact`,
      value: `preact.mdx`,
    },
    {
      label: `Add GitLab CI/CD`,
      value: `gitlab-ci-cd.mdx`,
    },
  ]

  return (
    <SelectInput.default
      items={items}
      onSelect={setRecipe}
      indicatorComponent={item => (
        <Text color={item.isSelected ? `yellow` : `magentaBright`}>
          {item.isSelected ? `>>` : `  `}
          {item.label}
        </Text>
      )}
      itemComponent={props => (
        <Text color="magentaBright">
          {props.isSelected}
          {` `}
          {props.label}
        </Text>
      )}
    />
  )
}

const Div = props => <Box textWrap="wrap" flexDirection="column" {...props} />

// Markdown ignores new lines and so do we.
function eliminateNewLines(children) {
  return React.Children.map(children, child => {
    if (!React.isValidElement(child)) {
      return child.replace(/(\r\n|\n|\r)/gm, ` `)
    }

    if (child.props.children) {
      child = React.cloneElement(child, {
        children: eliminateNewLines(child.props.children),
      })
    }

    return child
  })
}

const ResourceComponent = props => {
  let resource
  if (props._key) {
    resource = useResource(props._key)
  } else {
    resource = useResourceByUUID(props._uuid)
  }

  return (
    <Div marginBottom={1}>
      <Text color="yellow" backgroundColor="black" bold underline>
        {resource.resourceName}:
      </Text>
      <Text color="green">{resource?.describe}</Text>
      {resource?.diff ? (
        <>
          <Text>{` `}</Text>
          <Text>{resource?.diff}"</Text>
        </>
      ) : null}
    </Div>
  )
}

const components = {
  inlineCode: props => <Text {...props} />,
  pre: props => <Div {...props} />,
  code: props => {
    // eslint-disable-next-line
    let language = "```"
    if (props.className) {
      // eslint-disable-next-line
      language = props.className.split(`-`)[1]
    }
    const children = hicat(props.children.trim(), { lang: language })

    const ansi = `\`\`\`${language}\n${children.ansi}\n\`\`\``

    return (
      <Div marginBottom={1}>
        <Text>{ansi}</Text>
      </Div>
    )
  },
  h1: props => (
    <Box marginBottom={1}>
      <Text bold underline {...props} />
    </Box>
  ),
  h2: props => <Text bold {...props} />,
  h3: props => <Text bold italic {...props} />,
  h4: props => <Text bold {...props} />,
  h5: props => <Text bold {...props} />,
  h6: props => <Text bold {...props} />,
  a: ({ href, children }) => <Link url={href}>{children}</Link>,
  strong: props => <Text bold {...props} />,
  em: props => <Text italic {...props} />,
  p: props => {
    const children = eliminateNewLines(props.children)
    return (
      <Box>
        <Text>{children}</Text>
      </Box>
    )
  },
  // Don't use <Box> for li > p as that breaks Ink.
  "li.p": props => {
    const children = eliminateNewLines(props.children)
    return <Text>{children}</Text>
  },
  // p: () => <Text>`hi`</Text>, // null,
  ul: props => <Div marginBottom={1}>{props.children}</Div>,
  li: props => <Text>* {props.children}</Text>,
  Config: () => null,
  GatsbyPlugin: props => <ResourceComponent {...props} />,
  NPMPackageJson: props => <ResourceComponent {...props} />,
  NPMPackage: props => <ResourceComponent {...props} />,
  File: props => <ResourceComponent {...props} />,
  Directory: props => <ResourceComponent {...props} />,
  GatsbyShadowFile: () => null,
  NPMScript: props => <ResourceComponent {...props} />,
  RecipeIntroduction: props => <Div {...props} />,
  RecipeStep: props => {
    const children = React.Children.toArray(props.children)
    const firstChild = children.shift()
    children.unshift(
      <Box key="header" flexDirection="row">
        <Text>
          {props.step}){` `}
        </Text>
        {firstChild}
      </Box>
    )

    return (
      <Div>
        <Box
          borderStyle="single"
          padding={1}
          flexDirection="column"
          borderColor="magentaBright"
        >
          {children}
        </Box>
      </Div>
    )
  },
  div: props => <Div {...props} />,
}

export default async ({
  recipe,
  isDevelopMode,
  isInstallMode,
  graphqlPort,
  projectRoot,
}) => {
  try {
    const GRAPHQL_ENDPOINT = `http://localhost:${graphqlPort}/graphql`

    const subscriptionClient = new SubscriptionClient(
      `ws://localhost:${graphqlPort}/graphql`,
      {
        reconnect: true,
      },
      ws
    )

    let showRecipesList = false

    if (!recipe) {
      showRecipesList = true
    }

    const client = createClient({
      fetch,
      url: GRAPHQL_ENDPOINT,
      exchanges: [
        ...defaultExchanges,
        subscriptionExchange({
          forwardSubscription(operation) {
            return subscriptionClient.request(operation)
          },
        }),
      ],
    })
    const Plan = ({ state, localRecipe, isDevelopMode }) => {
      const { exit } = useApp()
      // Exit the app after we render
      useEffect(() => {
        if (!isDevelopMode) {
          exit()
        }
      }, [])

      return (
        <>
          <ResourceProvider
            value={
              state.context.plan?.filter(p => p.resourceName !== `Input`) || []
            }
          >
            <WelcomeMessage />
            {isDevelopMode ? (
              <Box flexDirection="column" marginBottom={2}>
                <Text strong underline>
                  DEVELOP MODE
                </Text>
              </Box>
            ) : null}
            <MDX key="DOC" components={components} remarkPlugins={[removeJsx]}>
              {state.context.exports?.join(`\n`) +
                `\n\n` +
                state.context.steps.join(`\n`)}
            </MDX>
            <Text>{`\n------\n`}</Text>
            <Text color="yellow">To install this recipe, run:</Text>
            <Text>{` `}</Text>
            <Text>
              {`  `}gatsby recipes {localRecipe} --install
            </Text>
            <Text>{` `}</Text>
          </ResourceProvider>
        </>
      )
    }

    const Installing = ({ state }) => (
      <Div>
        {state.context.plan.map((p, i) => (
          <Div key={`${p.resourceName}-${i}`}>
            <Text italic>{p.resourceName}:</Text>
            <Text>
              {` `}
              {p.isDone ? `✅ ` : <Spinner.default />}
              {` `}
              {p.isDone ? p._message : p.describe}
              {` `}
              {state.context.elapsed > 0 && (
                <Text>({state.context.elapsed / 1000}s elapsed)</Text>
              )}
            </Text>
          </Div>
        ))}
      </Div>
    )

    let sentContinue = false
    const RecipeInterpreter = () => {
      const { exit } = useApp()
      // eslint-disable-next-line
      const [localRecipe, setRecipe] = useState(recipe)

      const [subscriptionResponse] = useSubscription(
        {
          query: `
          subscription {
            operation {
              state
            }
          }
        `,
        },
        (_prev, now) => now
      )

      // eslint-disable-next-line
      const [_, createOperation] = useMutation(`
        mutation ($recipePath: String!, $projectRoot: String!) {
          createOperation(recipePath: $recipePath, projectRoot: $projectRoot)
        }
      `)
      // eslint-disable-next-line
      const [__, _sendEvent] = useMutation(`
        mutation($event: String!, $input: String) {
          sendEvent(event: $event, input: $input)
        }
      `)

      const sendEvent = ({ event, input }) => {
        if (input) {
          _sendEvent({
            event,
            input: JSON.stringify(input),
          })
        } else {
          _sendEvent({ event })
        }
      }

      subscriptionClient.connectionCallback = async () => {
        if (!showRecipesList) {
          try {
            await createOperation({
              recipePath: localRecipe,
              projectRoot,
            })
          } catch (e) {
            console.log(`error creating operation`, e)
          }
        }
      }

      const state =
        subscriptionResponse.data &&
        JSON.parse(subscriptionResponse.data.operation.state)

      useInput((_, key) => {
        if (showRecipesList) {
          return
        }
        if (key.return) {
          sendEvent({ event: `CONTINUE` })
        }
      })

      if (showRecipesList) {
        return (
          <>
            <WelcomeMessage />
            <Text bold underline>
              Select a recipe to run
            </Text>
            <RecipesList
              setRecipe={async recipeItem => {
                setRecipe(recipeItem.value.slice(0, -4))
                trackCli(`RECIPE_RUN`, { name: recipeItem.value })
                showRecipesList = false
                try {
                  await createOperation({
                    recipePath: recipeItem.value,
                    projectRoot,
                  })
                } catch (e) {
                  console.log(`error creating operation`, e)
                }
              }}
            />
          </>
        )
      }

      const Error = ({ state }) => {
        if (state && state.context && state.context.error) {
          return <Text red>{JSON.stringify(state.context.error, null, 2)}</Text>
        }

        return null
      }

      if (state?.value === `doneError`) {
        return <Error width="100%" state={state} />
      }

      let isReady

      // If installing, continue from presentPlan to applyingPlan
      if (state?.value === `presentPlan` && isInstallMode) {
        if (!sentContinue) {
          sendEvent({ event: `CONTINUE` })
          sentContinue = true
        }
      }

      // install mode
      if (isInstallMode) {
        isReady = state?.value === `applyingPlan` || state?.value === `done`
      } else {
        isReady = state?.value === `presentPlan`
      }

      if (!isReady) {
        return (
          <Text>
            <Spinner.default /> Loading recipe
          </Text>
        )
      }

      const isDone = state.value === `done`

      // If we're done with an error, render out error (happens below)
      // then exit.
      if (state.value === `doneError`) {
        process.nextTick(() => process.exit())
      }

      if (isDone) {
        process.nextTick(() => {
          subscriptionClient.close()
          exit()
          process.stdout.write(
            `\n\n---\n\n\nThe recipe finished successfully!\n\n`
          )
          process.exit()
        })
        // return null
      }

      if (isInstallMode) {
        return <Installing state={state} />
      } else {
        return (
          <Plan
            state={state}
            localRecipe={localRecipe}
            isDevelopMode={isDevelopMode}
          />
        )
      }
    }

    const Wrapper = () => (
      <>
        <Provider value={client}>
          <Text>{` `}</Text>
          <RecipeInterpreter />
        </Provider>
      </>
    )

    const Recipe = () => <Wrapper />

    // Enable experimental mode for more efficient reconciler and renderer
    const { waitUntilExit } = render(<Recipe />, { experimental: true })
    await waitUntilExit()
  } catch (e) {
    console.log(e)
  }
}
