import { ApolloClient, createHttpLink, InMemoryCache, gql } from "@apollo/client";

const LITERAL_BASE_URL = "https://literal.club/graphql/";

export const literalClient = new ApolloClient({
  ssrMode: true,
  link: createHttpLink({
    uri: LITERAL_BASE_URL,
    credentials: "same-origin",
  }),
  cache: new InMemoryCache(),
});

export async function getCurrentlyReading(profileId: string) {
  const { data } = await literalClient.query({
    query: gql`
      query booksReadingAndCompleted($profileId: String!) {
        currentlyReading: booksByReadingStateAndProfile(
          limit: 3
          offset: 0
          readingStatus: IS_READING
          profileId: $profileId
        ) {
          slug
          title
          publishedDate
          cover
          authors {
            name
          }
        }
        recentlyCompleted: booksByReadingStateAndProfile(
          limit: 1
          offset: 0
          readingStatus: FINISHED
          profileId: $profileId
        ) {
          slug
          title
          publishedDate
          cover
          authors {
            name
          }
        }
      }
    `,
    variables: {
      profileId: profileId,
    },
  });

  const currentlyReading = data.currentlyReading?.length
    ? data.currentlyReading.map(book => ({
        title: book.title,
        author: book.authors[0]?.name,
        url: `https://literal.club/book/${book.slug}`,
      }))
    : [];

  const lastCompleted = data.recentlyCompleted?.length
    ? {
        title: data.recentlyCompleted[0].title,
        author: data.recentlyCompleted[0].authors[0]?.name,
        url: `https://literal.club/book/${data.recentlyCompleted[0].slug}`,
      }
    : null;

  return {
    currentlyReading,
    lastCompleted,
  };
}