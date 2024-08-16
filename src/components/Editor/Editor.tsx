import React, { useCallback, useRef, useState } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { Diagnostic, linter, lintGutter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { sparql } from '@codemirror/legacy-modes/mode/sparql';
import { CompletionContext, autocompletion } from '@codemirror/autocomplete';
import classes from './Editor.module.scss';
import { Button, Dropdown, Flex, Space } from 'antd';
import { DownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { Parser } from 'sparqljs';
import { useAppStateContext } from '../../hooks/useAppState';

const parser = new Parser();

const exampleQueries = {
  select: `SELECT ?subject ?predicate ?object\nWHERE {\n  ?subject ?predicate ?object\n}\nLIMIT 25\n`,
};

type Props = {
  dataset: string;
  runQuery: (query: string) => void;
};

const Editor = (props: Props) => {
  const { dataset, runQuery } = props;

  const {
    state: { queries },
    actions: {
      queries: { updateActiveQuery },
    },
  } = useAppStateContext();

  const activeQuery = queries[dataset]?.activeQuery;

  const [variables, setVariables] = useState<string[]>([]);
  const [canRunQuery, setCanRunQuery] = useState(false);

  const editorRef = useRef<ReactCodeMirrorRef>({});

  const exampleQueriesDropdown = {
    items: [
      {
        label: 'SELECT query',
        key: 'select',
      },
    ],
    onClick: ({ key }: { key: keyof typeof exampleQueries }) => {
      if (editorRef.current?.view) {
        const state = editorRef.current.view.state;

        const cursor = state.selection.main.head;
        const transaction = state.update({
          changes: {
            from: cursor,
            insert: exampleQueries[key],
          },
          selection: { anchor: cursor + 1 },
          scrollIntoView: true,
        });

        if (transaction) {
          editorRef.current.view.dispatch(transaction);
        }
      }
    },
  };

  const onChange = useCallback(
    (val: string) => {
      updateActiveQuery(dataset, val);
      setCanRunQuery(false);
    },
    [dataset, updateActiveQuery],
  );

  const handleRunQuery = useCallback(() => {
    runQuery(activeQuery);
  }, [runQuery, activeQuery]);

  const sparqlLinter = useCallback(
    (view: EditorView) => {
      try {
        const parsedQuery = parser.parse(view.state.doc.toString());
        console.log('MAX parsed', parsedQuery);

        const vars: string[] = parsedQuery?.variables?.map((v) => v.value) || [];

        if (vars.sort().toString() !== variables.sort().toString()) {
          setVariables(vars);
        }

        setCanRunQuery(view.state.doc.length > 0);
        return [];
      } catch (err) {
        const errorLines: string[] = (err as Error).message.split('\n');

        if (errorLines.length < 4)
          return [
            {
              from: 0,
              to: view.state.doc.length,
              severity: 'error',
              message: (err as Error).message,
            } as Diagnostic,
          ];

        const isEllipsis = errorLines[1].startsWith('...');
        const subStringError = isEllipsis ? errorLines[1].slice(3) : errorLines[1];
        const errorColumn = errorLines[2].length;

        const editorContent = view.state.doc.sliceString(0, view.state.doc.length, '');
        const findFirstPos = editorContent.indexOf(subStringError) || 0;
        const errorPos = findFirstPos + errorColumn;

        return [
          {
            from: errorPos + (view.state.doc.lineAt(errorPos).number - 1) - 1 - (isEllipsis ? 3 : 0),
            to: errorPos + (view.state.doc.lineAt(errorPos).number - 1) - 1 - (isEllipsis ? 3 : 0),
            severity: 'error',
            message: errorLines[3],
          } as Diagnostic,
        ];
      }
    },
    [variables],
  );

  const sparqlAutocomplete = useCallback(() => {
    return autocompletion({
      override: [
        (context: CompletionContext) => {
          let word = context.matchBefore(/(\?|\$)(\w+)?/);
          if (!word) return null;
          if (word && word.from == word.to && !context.explicit) {
            return null;
          }

          return {
            from: word?.from!,
            options: variables.flatMap((v) => {
              return [{ label: `?${v}` }, { label: `$${v}` }];
            }),
          };
        },
      ],
    });
  }, [variables]);

  return (
    <Flex vertical justify="flex-start" style={{ height: '100%' }} gap="small">
      <CodeMirror
        ref={editorRef}
        value={activeQuery}
        height={'100%'}
        extensions={[StreamLanguage.define(sparql), linter(sparqlLinter, {}), lintGutter(), sparqlAutocomplete()]}
        onChange={onChange}
        className={classes.editor}
        basicSetup={{
          foldGutter: true,
        }}
      />
      <Flex align="center" justify="flex-start" style={{ padding: '0px 10px', flexShrink: 0 }}>
        <Dropdown menu={exampleQueriesDropdown}>
          <Button>
            <Space>
              Example queries
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
        <div style={{ flex: 1 }}></div>
        <Button type="primary" onClick={handleRunQuery} disabled={!canRunQuery} icon={<CaretRightOutlined />}>
          Run query
        </Button>
      </Flex>
    </Flex>
  );
};

export default Editor;
