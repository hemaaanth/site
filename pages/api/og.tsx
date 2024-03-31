import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};
 
export default async function handler(request: NextRequest) {

// Make sure the font exists in the specified path:
  const fontData = await fetch(
    new URL('../../public/inter.roman.var.ttf', import.meta.url),
  ).then((res) => res.arrayBuffer());

    const { searchParams } = new URL(request.url);
 
    // ?title=<title>
    const hasTitle = searchParams.has('title');
    const title = hasTitle
      ? searchParams.get('title')?.slice(0, 100)
      : 'Hemanth Soni';

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          color: 'white',
          background: 'black',
          width: '100%',
          height: '100%',
          padding: '50px 200px',
          textAlign: 'left',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: '"Inter"'
        }}
      >
        {title}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
        },
      ],
    },
  );
}