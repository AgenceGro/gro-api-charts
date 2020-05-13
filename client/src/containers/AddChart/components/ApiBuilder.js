import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import {
  Grid, Form, Header, Dropdown, Input, Menu, Button, List, Icon, Checkbox,
  Divider, Label,
} from "semantic-ui-react";
import brace from "brace"; // eslint-disable-line
import AceEditor from "react-ace";
import uuid from "uuid/v4";
import _ from "lodash";

import "brace/mode/json";
import "brace/theme/tomorrow";

import { testApiRequest } from "../../../actions/connection";
import { getDataRequestByChart } from "../../../actions/dataRequest";
import ApiPagination from "../../../components/ApiPagination";

const methods = [{
  key: 1,
  text: "GET",
  value: "GET",
}, {
  key: 2,
  text: "POST",
  value: "POST",
}, {
  key: 3,
  text: "PUT",
  value: "PUT",
}, {
  key: 4,
  text: "DELETE",
  value: "DELETE",
}, {
  key: 5,
  text: "OPTIONS",
  value: "OPTIONS",
}];

/*
  The API Data Request builder
*/
function ApiBuilder(props) {
  const [apiRequest, setApiRequest] = useState({
    method: "GET",
    route: "",
    useGlobalHeaders: true,
    formattedHeaders: [{
      id: uuid(),
      key: "",
      value: "",
    }]
  });
  const [result, setResult] = useState("");
  const [activeMenu, setActiveMenu] = useState("headers");
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState(false);

  const {
    dataRequest, chartId, getDataRequestByChart, match, onChangeRequest,
    connection, testApiRequest, onComplete, onPaginationChanged,
    offset, items, itemsLimit, pagination,
  } = props;

  // on init effect
  useEffect(() => {
    if (dataRequest) {
      setApiRequest(dataRequest);
    }

    if (chartId > 0 && !dataRequest) {
      getDataRequestByChart(match.params.projectId, chartId)
        .then((fetchedRequest) => {
          // format the headers into key: value -> value: value format
          const formattedApiRequest = fetchedRequest;
          const formattedHeaders = [];
          Object.keys(fetchedRequest.headers).forEach((key) => {
            formattedHeaders.push({
              id: uuid(),
              key,
              value: fetchedRequest.headers[key],
            });
          });

          formattedApiRequest.formattedHeaders = formattedHeaders;

          setApiRequest(formattedApiRequest);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!_.isEqual(dataRequest, apiRequest)) {
      onChangeRequest(apiRequest);
    }
  }, [apiRequest, onChangeRequest]);

  const _addHeader = () => {
    const { formattedHeaders } = apiRequest;

    formattedHeaders.push({
      id: uuid(),
      key: "",
      value: "",
    });

    setApiRequest({ ...apiRequest, formattedHeaders });
  };

  const _removeHeader = (id) => {
    const { formattedHeaders } = apiRequest;

    let found;
    for (let i = 0; i < formattedHeaders.length; i++) {
      if (formattedHeaders[i].id === id) {
        found = i;
        break;
      }
    }
    if (found) formattedHeaders.splice(found, 1);

    setApiRequest({ ...apiRequest, formattedHeaders });
  };

  const _onChangeHeader = (id, value) => {
    const { formattedHeaders } = apiRequest;

    for (let i = 0; i < formattedHeaders.length; i++) {
      if (formattedHeaders[i].id === id) {
        formattedHeaders[i].key = value;
        break;
      }
    }

    setApiRequest({ ...apiRequest, formattedHeaders });
  };

  const _onChangeHeaderValue = (id, value) => {
    const { formattedHeaders } = apiRequest;

    for (let i = 0; i < formattedHeaders.length; i++) {
      if (formattedHeaders[i].id === id) {
        formattedHeaders[i].value = value;
        break;
      }
    }

    setApiRequest({ ...apiRequest, formattedHeaders });
  };

  const _changeMethod = (value) => {
    if (value === "GET" || value === "OPTIONS") {
      setApiRequest({ ...apiRequest, method: value });
      setActiveMenu("headers");
    } else {
      setApiRequest({ ...apiRequest, method: value });
    }
  };

  const _onToggleGlobal = () => {
    setApiRequest({
      ...apiRequest, useGlobalHeaders: !apiRequest.useGlobalHeaders,
    });
  };

  const _onChangeBody = (value) => {
    setApiRequest({ ...apiRequest, body: value });
  };

  const _onChangeRoute = (value) => {
    if (value[0] !== "/") {
      value = `/${value}`; // eslint-disable-line
    }

    setApiRequest({ ...apiRequest, route: value });
  };

  const _onTest = () => {
    const { formattedHeaders } = apiRequest;
    let newHeaders = {};
    for (let i = 0; i < formattedHeaders.length; i++) {
      if (formattedHeaders[i].key && formattedHeaders[i].value) {
        newHeaders = { ...newHeaders, [formattedHeaders[i].key]: formattedHeaders[i].value };
      }
    }

    const finalApiRequest = { dataRequest: apiRequest };
    finalApiRequest.dataRequest.headers = newHeaders;

    finalApiRequest.pagination = pagination;
    finalApiRequest.items = items;
    finalApiRequest.offset = offset;
    finalApiRequest.itemsLimit = itemsLimit;

    setRequestLoading(true);
    setRequestSuccess(false);
    setRequestError(false);
    testApiRequest(match.params.projectId, connection.id, finalApiRequest)
      .then((result) => {
        setRequestLoading(false);
        setRequestSuccess(result.status);
        setResult(JSON.stringify(result.body, null, 2));

        onComplete(result.body);
      })
      .catch((error) => {
        setRequestLoading(false);
        setRequestError(error);
        setResult(JSON.stringify(error, null, 2));
      });
  };

  return (
    <div style={styles.container}>
      <Grid columns={2} stackable centered>
        <Grid.Row>
          <Grid.Column width={15}>
            <Form>
              <Form.Group widths={3}>
                <Form.Field width={2}>
                  <label>Method</label>
                  <Dropdown
                    fluid
                    text={apiRequest.method}
                    options={methods}
                    selection
                    onChange={(e, data) => _changeMethod(data.value)}
                  />
                </Form.Field>
                <Form.Field width={12}>
                  <label>{"Add the route and any query parameters below"}</label>
                  <Input
                    label={connection.host}
                    placeholder="/route?key=value"
                    focus
                    value={apiRequest.route || ""}
                    onChange={(e, data) => _onChangeRoute(data.value)}
                  />
                </Form.Field>
                <Form.Field width={2}>
                  <label>Make the request</label>
                  <Button
                    primary
                    icon
                    labelPosition="right"
                    loading={requestLoading}
                    onClick={_onTest}
                  >
                    <Icon name="play" />
                    Send
                  </Button>
                </Form.Field>
              </Form.Group>
            </Form>
          </Grid.Column>
          <Grid.Column width={1} />
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={10}>
            <Menu pointing secondary>
              <Menu.Item
                name="Headers"
                active={activeMenu === "headers"}
                onClick={() => setActiveMenu("headers")}
              />
              <Menu.Item
                name="Body"
                disabled={apiRequest.method === "GET" || apiRequest.method === "OPTIONS"}
                active={activeMenu === "body"}
                onClick={() => setActiveMenu("body")}
              />
              <Menu.Item
                name="Pagination"
                active={activeMenu === "pagination"}
                onClick={() => setActiveMenu("pagination")}
              />
            </Menu>
            {activeMenu === "headers" && (
              <div>
                {connection.options && connection.options.length > 0 && (
                  <div>
                    <Checkbox
                      label="Enable global headers"
                      defaultChecked={!!apiRequest.useGlobalHeaders}
                      onChange={_onToggleGlobal}
                    />

                    {apiRequest.useGlobalHeaders && (
                      <List>
                        {connection.options.map((header) => {
                          return (
                            <List.Item key={header}>
                              <List.Content>
                                <Form>
                                  <Form.Group widths={2}>
                                    <Form.Field width={7}>
                                      <Input value={Object.keys(header)[0]} />
                                    </Form.Field>
                                    <Form.Field width={7}>
                                      <Input value={header[Object.keys(header)[0]]} />
                                    </Form.Field>
                                  </Form.Group>
                                </Form>
                              </List.Content>
                            </List.Item>
                          );
                        })}
                      </List>
                    )}

                    <Divider />
                  </div>
                )}
                <List>
                  {apiRequest.formattedHeaders && apiRequest.formattedHeaders.map((header) => {
                    return (
                      <List.Item key={header.id}>
                        <List.Content>
                          <Form>
                            <Form.Group widths={3}>
                              <Form.Field width={7}>
                                <Input
                                  placeholder="Header"
                                  value={header.key}
                                  onChange={(e, data) => {
                                    _onChangeHeader(header.id, data.value);
                                  }}
                                />
                              </Form.Field>
                              <Form.Field width={7}>
                                <Input
                                  placeholder="Value"
                                  value={header.value}
                                  onChange={(e, data) => {
                                    _onChangeHeaderValue(header.id, data.value);
                                  }}
                                />
                              </Form.Field>
                              <Form.Field width={1}>
                                <Button
                                  icon
                                  onClick={() => _removeHeader(header.id)}
                                >
                                  <Icon name="close" />
                                </Button>
                              </Form.Field>
                            </Form.Group>
                          </Form>
                        </List.Content>
                      </List.Item>
                    );
                  })}
                </List>

                <Button
                  icon
                  labelPosition="right"
                  size="small"
                  onClick={_addHeader}
                >
                  <Icon name="plus" />
                  Add header
                </Button>
              </div>
            )}
            {activeMenu === "body" && (
              <div>
                <AceEditor
                  mode="json"
                  theme="tomorrow"
                  height="400px"
                  width="none"
                  value={apiRequest.body || ""}
                  onChange={(value) => {
                    _onChangeBody(value);
                  }}
                  name="queryEditor"
                  editorProps={{ $blockScrolling: true }}
                />
              </div>
            )}
            {activeMenu === "pagination" && (
              <ApiPagination
                items={items}
                itemsLimit={itemsLimit}
                offset={offset}
                pagination={pagination}
                onPaginationChanged={onPaginationChanged}
                apiRoute={apiRequest.route}
              />
            )}
          </Grid.Column>
          <Grid.Column width={6}>
            <Header as="h3" dividing style={{ paddingTop: 15 }}>Result:</Header>
            {requestSuccess && (
              <>
                <Label color="green" style={{ marginBottom: 10 }}>
                  {`${requestSuccess.statusCode} ${requestSuccess.statusText}`}
                </Label>
                <Label style={{ marginBottom: 10 }}>
                  {`Length: ${result ? JSON.parse(result).length : 0}`}
                </Label>
              </>
            )}
            {requestError && (
              <Label color="red" style={{ marginBottom: 10 }}>
                {`${requestError.statusCode} ${requestError.statusText}`}
              </Label>
            )}
            <AceEditor
              mode="json"
              theme="tomorrow"
              height="400px"
              width="none"
              value={result || ""}
              onChange={() => setResult(result)}
              name="resultEditor"
              editorProps={{ $blockScrolling: false }}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
}
const styles = {
  container: {
    flex: 1,
  },
};

ApiBuilder.defaultProps = {
  dataRequest: null,
  chartId: -1,
  items: "limit",
  itemsLimit: 100,
  offset: "offset",
  pagination: false,
};

ApiBuilder.propTypes = {
  connection: PropTypes.object.isRequired,
  testApiRequest: PropTypes.func.isRequired,
  getDataRequestByChart: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
  onChangeRequest: PropTypes.func.isRequired,
  dataRequest: PropTypes.object,
  chartId: PropTypes.number,
  items: PropTypes.string,
  itemsLimit: PropTypes.number,
  offset: PropTypes.string,
  pagination: PropTypes.bool,
  onPaginationChanged: PropTypes.func.isRequired,
};

const mapStateToProps = () => {
  return {
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    testApiRequest: (projectId, connectionId, apiRequest) => {
      return dispatch(testApiRequest(projectId, connectionId, apiRequest));
    },
    getDataRequestByChart: (projectId, chartId) => {
      return dispatch(getDataRequestByChart(projectId, chartId));
    },
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ApiBuilder));
