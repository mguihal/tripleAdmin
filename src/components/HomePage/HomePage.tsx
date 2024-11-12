import { useEffect, useState } from 'react';
import { Alert, Card, Col, Layout, Row, Space, Statistic, Typography } from 'antd';
import semver from 'semver';
import { useAppStateContext } from '../../hooks/useAppState';
import packageJson from '../../../package.json';

const { Content } = Layout;

const formatUptime = (value: number) => {
  const days = Math.floor(value / 3600 / 24);
  const hours = Math.floor((value - days * 3600 * 24) / 3600);
  const minutes = Math.floor((value - days * 3600 * 24 - hours * 3600) / 60);
  const seconds = Math.floor(value - days * 3600 * 24 - hours * 3600 - minutes * 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const HomePage = () => {
  const {
    state: {
      server: { host, attributes },
    },
  } = useAppStateContext();

  const [lastVersion, setLastVersion] = useState('');
  const [isUpToDate, setIsUpToDate] = useState(false);

  useEffect(() => {
    fetch('/api/lastVersion')
      .then((response) => {
        if (response.ok) {
          response.text().then((content) => {
            if (semver.valid(content)) {
              setLastVersion(semver.clean(content) || '');
              setIsUpToDate(semver.gte(packageJson.version, content));
            }
          });
        }
      })
      .catch((err) => console.log('ERR', err));
  }, []);

  if (!host || !attributes) {
    return;
  }

  return (
    <Layout style={{ padding: '24px', height: '100%' }}>
      <Content style={{ height: '100%' }}>
        <Row style={{ height: '100%' }} gutter={16}>
          <Col offset={0} span={6}>
            <Card title="Server info" bordered={false}>
              <Space direction="vertical">
                <Space direction="vertical" size={0}>
                  <Typography.Text type="secondary">Host</Typography.Text>
                  <Typography.Link href={host} target="_blank">
                    {host}
                  </Typography.Link>
                </Space>
                <Statistic title="Version" value={attributes.version} />
                <Statistic title="Uptime" value={formatUptime(attributes.uptime)} />
              </Space>
            </Card>
          </Col>
          <Col offset={0} span={6}>
            <Card title="TripleAdmin" bordered={false}>
              <Space direction="vertical">
                <Statistic title="Your version" value={packageJson.version} />
                <Space direction="vertical" size={0}>
                  <Typography.Text type="secondary">Last version</Typography.Text>
                  <span>
                    {lastVersion || 'Unable to fetch last version'}
                    {lastVersion !== '' && (
                      <>
                        &nbsp;(
                        <Typography.Link
                          href={'https://github.com/mguihal/tripleAdmin/releases/latest'}
                          target="_blank"
                        >
                          Release notes
                        </Typography.Link>
                        )
                      </>
                    )}
                  </span>
                </Space>
                {isUpToDate ? (
                  <Alert message="You are running last version&nbsp;&nbsp;🎉" type="success" />
                ) : (
                  <Alert type="warning" message="⚠️  Upgrade to the latest version" />
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default HomePage;
