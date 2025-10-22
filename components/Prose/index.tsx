import React from 'react';
import { HoverNote } from '../HoverNote';

const Header = ({ level, children, ...props }: { level: number; children: React.ReactNode; [x: string]: any }) => {
  const id = children.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return React.createElement(Tag, { id, ...props }, children);
};

export const mdxComponents = {
  a: (props) => (
    <a className="link" target="_blank" rel="noopener noreferrer" {...props} />
  ),

  Note: (props) => (
    <div className="mb-5 rounded border border-gray-200 p-4 pb-3 dark:border-neutral-800 ">
      {props.children}
    </div>
  ),
  Aside: (props) => (
    <div className="prose-p:text-neutral-600">
      {props.children}
    </div>
  ),
  HoverNote: (props) => <HoverNote {...props} />,
  h1: (props) => <Header level={1} {...props} />,
  h2: (props) => <Header level={2} {...props} />,
  h3: (props) => <Header level={3} {...props} />,
  h4: (props) => <Header level={4} {...props} />,
  h5: (props) => <Header level={5} {...props} />,
  h6: (props) => <Header level={6} {...props} />,
};
