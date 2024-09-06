import { useCallback, useEffect, useRef, useState } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { Diagnostic, linter, lintGutter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { sparql } from '@codemirror/legacy-modes/mode/sparql';
import { CompletionContext, autocompletion } from '@codemirror/autocomplete';
import classes from './Editor.module.scss';
import { Button, Dropdown, Flex, Segmented, Space, Spin } from 'antd';
import { DownOutlined, CaretRightOutlined, TableOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAppStateContext } from '../../hooks/useAppState';

const exampleQueries = {
  select: `# Selection of 25 first triples\nSELECT ?subject ?predicate ?object\nWHERE {\n  ?subject ?predicate ?object\n}\nLIMIT 25\n`,
  ask: `# Ask existence of a triple\nASK {\n  <subject> <predicate> <object> .\n}\n`,
  insert: `# Insertion of triples\nINSERT DATA {\n  <subject> <predicate> <object> .\n}\n`,
};

type Props = {
  dataset: string;
  pending: boolean;
  runQuery: (query: string) => void;
  view: 'results' | 'history';
  onViewChange: (view: 'results' | 'history') => void;
  query?: string;
};

const Editor = (props: Props) => {
  const { dataset, pending, runQuery, view, onViewChange, query } = props;

  const {
    state: {
      server: { getGraphs },
      queries: { queryState },
    },
    actions: {
      queries: { updateActiveQuery },
    },
  } = useAppStateContext();

  const activeQuery = queryState[dataset]?.activeQuery;

  const timerRef = useRef<number>();

  const [variables, setVariables] = useState<string[]>([]);
  const [canRunQuery, setCanRunQuery] = useState(false);
  const [queryTime, setQueryTime] = useState(0);

  const editorRef = useRef<ReactCodeMirrorRef>({});

  const exampleQueriesDropdown = {
    items: [
      {
        label: 'SELECT query',
        key: 'select',
      },
      {
        label: 'ASK query',
        key: 'ask',
      },
      {
        label: 'INSERT INTO query',
        key: 'insert',
      },
    ],
    onClick: ({ key }: { key: string }) => {
      if (editorRef.current?.view) {
        const state = editorRef.current.view.state;

        // const cursor = state.selection.main.head;
        const transaction = state.update({
          changes: {
            from: 0,
            to: state.doc.length,
            insert: exampleQueries[key as keyof typeof exampleQueries],
          },
          // selection: { anchor: cursor + 1 },
          scrollIntoView: true,
        });

        if (transaction) {
          editorRef.current.view.dispatch(transaction);
        }
      }
    },
  };

  useEffect(() => {
    if (query && editorRef.current?.view) {
      const state = editorRef.current.view.state;

      const cursor = state.selection.main.head;
      const transaction = state.update({
        changes: {
          from: 0,
          to: state.doc.length,
          insert: query,
        },
        selection: { anchor: cursor + 1 },
        scrollIntoView: true,
      });

      if (transaction) {
        editorRef.current.view.dispatch(transaction);
      }
    }
  }, [query]);

  useEffect(() => {
    if (pending) {
      timerRef.current = window.setInterval(() => {
        setQueryTime((t) => t + 100);
      }, 100);
    } else {
      clearInterval(timerRef.current);
      setQueryTime(0);
    }
  }, [pending]);

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
        const query = view.state.doc.toString();
        const variablesMatches = [...query.matchAll(/(\?\w+|\$\w+)/gm)];
        const vars = [...new Set(variablesMatches.map(f => f[0].slice(1)))];

        if (vars.sort().toString() !== variables.sort().toString()) {
          setVariables([...new Set(variablesMatches.map(f => f[0].slice(1)))]);
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
          // Graphs
          const graphWord = context.matchBefore(/graph ?(\w+)?/i);

          if (graphWord) {
            if (graphWord.from == graphWord.to && !context.explicit) {
              return null;
            }

            return {
              from: graphWord.from + 5,
              options: getGraphs(dataset).map((g) => ({ label: ` <${g}>` })),
            };
          }

          // Variables
          const variableWord = context.matchBefore(/(\?|\$)(\w+)?/);

          if (variableWord) {
            if (variableWord.from == variableWord.to && !context.explicit) {
              return null;
            }

            return {
              from: variableWord.from,
              options: variables.flatMap((v) => {
                return [{ label: `?${v}` }, { label: `$${v}` }];
              }),
            };
          }

          return null;
        },
      ],
    });
  }, [variables, dataset, getGraphs]);

  const renderSpinner = () => {
    return (
      <Space direction="vertical">
        <span>Running query...</span>
        <span>{Math.round(queryTime / 100) / 10}s</span>
      </Space>
    );
  };

  return (
    <Flex vertical justify="flex-start" style={{ height: '100%' }} gap="small">
      <Spin tip={renderSpinner()} spinning={pending} wrapperClassName={classes.spinner}>
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
          readOnly={pending}
        />
      </Spin>
      <Flex align="center" justify="flex-start" style={{ padding: '0px 10px', flexShrink: 0 }} gap={8}>
        <Dropdown menu={exampleQueriesDropdown}>
          <Button disabled={pending}>
            <Space>
              Example queries
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
        <div style={{ flex: 1 }}></div>
        <Segmented
          value={view}
          onChange={(v: 'results' | 'history') => onViewChange(v)}
          options={[
            { value: 'results', icon: <TableOutlined />, label: 'Results' },
            { value: 'history', icon: <HistoryOutlined />, label: 'History' },
          ]}
        />
        <Button
          type="primary"
          onClick={handleRunQuery}
          disabled={!canRunQuery || pending}
          icon={<CaretRightOutlined />}
        >
          Run query
        </Button>
      </Flex>
    </Flex>
  );
};

export default Editor;
