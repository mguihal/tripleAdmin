import { Alert, AutoComplete, AutoCompleteProps, Button, Flex, Form, Input, Modal } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import useQuery from '../../hooks/useQuery';
import { useAppStateContext } from '../../hooks/useAppState';

interface AddFormValues {
  triples: {
    subject: string;
    predicate: string;
    object: string;
  }[];
}

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

const AddTriplesModal = ({ open, onClose, onAdded }: Props) => {
  const {
    state: {
      navigation: { urlObject },
    },
  } = useAppStateContext();
  const { getQuery } = useQuery(urlObject.dataset || '');

  const [addFormError, setAddFormError] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isPredicatesFetched, setIsPredicatesFetched] = useState(false);
  const [predicates, setPredicates] = useState<string[]>([]);
  const [options, setOptions] = useState<AutoCompleteProps['options']>([]);

  useEffect(() => {
    if (open && !isPredicatesFetched) {
      setIsPredicatesFetched(true);
      getQuery<'predicate'>(`SELECT DISTINCT ?predicate WHERE { ?subject ?predicate ?object }`)
        .then((response) => {
          if (response.type === 'read') {
            setPredicates(
              response.data.results.bindings.map((row) => `<${row.predicate?.value}>`).filter((e) => e !== undefined),
            );
          }
        })
        .catch((err) => {
          console.error('Error: could not load predicates:', err);
        });
    }
  }, [open, isPredicatesFetched, getQuery]);

  useEffect(() => {
    setOptions(predicates.map((p) => ({ label: p, value: p })));
  }, [predicates]);

  const handleAddTriples = useCallback(
    (values: AddFormValues) => {
      setConfirmLoading(true);
      setAddFormError(false);

      const graph = urlObject.graph || '';
      const query = `
    INSERT DATA {
      ${graph === 'default' ? '' : `GRAPH <${graph}> {`}
      ${values.triples
        .map((row) => {
          const quote = row.object.startsWith('<') && row.object.endsWith('>') ? '' : '"';
          return `${row.subject} ${row.predicate} ${quote}${row.object}${quote} .`;
        })
        .join('\n')}
      ${graph === 'default' ? '' : `}`}
    }
    `;

      getQuery(query)
        .then(() => {
          setConfirmLoading(false);
          onAdded();
        })
        .catch(() => {
          setConfirmLoading(false);
          setAddFormError(true);
        });
    },
    [getQuery, onAdded, urlObject.graph],
  );

  return (
    <Modal
      title="Add new triples"
      open={open}
      onOk={() => {}}
      okButtonProps={{ autoFocus: true, htmlType: 'submit' }}
      onCancel={onClose}
      okText="Add"
      confirmLoading={confirmLoading}
      width={1000}
      destroyOnClose
      modalRender={(dom) => (
        <Form
          name="tripleAddForm"
          onFinish={(values) => handleAddTriples(values)}
          autoComplete="off"
          clearOnDestroy
          initialValues={{
            triples: [{}],
          }}
        >
          {dom}
        </Form>
      )}
    >
      {addFormError && (
        <Alert
          type="error"
          message="An error happened when inserting these new rows. Please check them and retry"
          style={{ marginBottom: 16 }}
        />
      )}
      <Form.List name="triples">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Flex key={key} align="baseline" gap={8}>
                <Form.Item<AddFormValues['triples']>
                  {...restField}
                  name={[name, 'subject']}
                  rules={[{ required: true, message: 'Missing subject' }]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder="<subject>" />
                </Form.Item>
                <Form.Item<AddFormValues['triples']>
                  {...restField}
                  name={[name, 'predicate']}
                  rules={[{ required: true, message: 'Missing predicate' }]}
                  style={{ flex: 1 }}
                >
                  <AutoComplete
                    options={options}
                    placeholder="<predicate>"
                    onSearch={(text) =>
                      setOptions(
                        predicates
                          .filter((p) => p.toLowerCase().includes(text.toLowerCase()))
                          .map((p) => ({ label: p, value: p })),
                      )
                    }
                  />
                </Form.Item>
                <Form.Item<AddFormValues['triples']>
                  {...restField}
                  name={[name, 'object']}
                  rules={[{ required: true, message: 'Missing object' }]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder="<object> or object" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Flex>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add one more triple
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </Modal>
  );
};

export default AddTriplesModal;
