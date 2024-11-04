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
      query booksByReadingStateAndProfile($profileId: String!) {
        booksByReadingStateAndProfile(
          limit: 3  # Increased limit to show multiple books
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
      }
    `,
    variables: {
      profileId: profileId,
    },
  });

  if (!data.booksByReadingStateAndProfile?.length) return [];
  
  return data.booksByReadingStateAndProfile.map(book => ({
    title: book.title,
    author: book.authors[0]?.name,
    url: `https://literal.club/book/${book.slug}`,
  }));
}