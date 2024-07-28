import { Button, Form, Input, Layout, Row, Col, FormProps } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import useGetServer, { ServerAttributes } from "../../hooks/useGetServer";
import useStorage from "../../hooks/useStorage";

const { Content, Footer } = Layout;

type FieldType = {
  host: string;
  username: string;
  password: string;
};

type Props = {
  onLogged: (serverAttributes: ServerAttributes) => void;
};

const AuthPage = ({ onLogged }: Props) => {
  const [form] = Form.useForm();

  const { getServer } = useGetServer();
  const { getAuthData, setAuthData } = useStorage();

  const { host, username } = getAuthData();

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    const fetch = async () => {
      try {
        const response = await getServer(
          values.host,
          btoa(`${values.username}:${values.password}`)
        );

        setAuthData(values.host, values.username, values.password);
        onLogged(response);
      } catch (e) {
        const error = e as Error;
        form.setFields([
          {
            name: error.message === "Bad credentials" ? "username" : "host",
            errors: [error.message],
          },
        ]);
      }
    };

    fetch();
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Content>
        <Row align="middle" style={{ height: "100%" }}>
          <Col span={4} offset={10}>
            <Form
              name="login"
              layout="vertical"
              requiredMark="optional"
              onFinish={onFinish}
              form={form}
              initialValues={{
                host,
                username,
              }}
            >
              <Form.Item<FieldType>
                name="host"
                rules={[
                  { required: true, message: "Please input your host" },
                  {
                    type: "url",
                    message: "This must be a valid url",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                  placeholder="Host"
                />
              </Form.Item>

              <Form.Item<FieldType>
                name="username"
                rules={[
                  { required: true, message: "Please input your username" },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                  placeholder="Username"
                />
              </Form.Item>

              <Form.Item<FieldType>
                name="password"
                rules={[
                  { required: true, message: "Please input your password" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                  type="password"
                  placeholder="Password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: "100%" }}
                >
                  Connect
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        TripleAdmin - Created by @mguihal
      </Footer>
    </Layout>
  );
};

export default AuthPage;
