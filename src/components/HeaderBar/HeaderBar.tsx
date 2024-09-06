import { Button, Layout, Tag, Typography } from 'antd';
import { ApiOutlined, LogoutOutlined } from '@ant-design/icons';
import styles from './HeaderBar.module.scss';
import { useAppStateContext } from '../../hooks/useAppState';

const { Header } = Layout;

const HeaderBar = () => {
  const {
    state: {
      server: { host },
    },
    actions: {
      auth: { logout },
      navigation: { navigate },
    },
  } = useAppStateContext();

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 10,
      }}
    >
      <h1>
        <a
          href="/"
          className={styles.titleLink}
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          TripleAdmin
        </a>
      </h1>
      <Tag icon={<ApiOutlined />} color="#1678ff" bordered={false}>
        <Typography.Link href={host || ''} target="_blank">
          {host}
        </Typography.Link>
      </Tag>
      <Button
        type="link"
        icon={<LogoutOutlined />}
        style={{ color: 'white' }}
        onClick={(e) => {
          e.preventDefault();
          logout();
        }}
      />
    </Header>
  );
};

export default HeaderBar;
