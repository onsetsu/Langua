import React from "react";
import { render } from "react-dom";
import {
    Slider,
    Divider,
    Checkbox,
    Row,
    Col,
    Layout,
    Menu,
    Breadcrumb,
    Icon
} from "antd";
import { Controlled as CodeMirror } from "react-codemirror2";
import _ from "lodash";
require("codemirror/mode/javascript/javascript");
require("codemirror/mode/jsx/jsx");
const format = require("./format");

const Langua = window.Langua;

const transformFunctionCache = new Map();

const extensions = Object.keys(Langua.modules);
const all = new Set(extensions);

function getCompilationFunction(selectedExtensions) {
    const hash = selectedExtensions.sort().join("++");
    if (!transformFunctionCache.get(hash)) {
        const extensionSet = {};
        selectedExtensions.forEach(e => {
            extensionSet[e] = Langua.modules[e];
        });
        transformFunctionCache.set(
            hash,
            Langua.createCompileFunction(
                extensionSet,
                Langua.combinationTests,
                [["unit", "uncertainty"]]
            )
        );
    }
    return transformFunctionCache.get(hash);
}

const createSheet = (size, height) => `.CodeMirror {font-size: ${size}px; }
 .CodeMirror {
     height: ${height}vh !important;
 }

 // .CodeMirror-line {
 //    margin-left: ${size * 5 / 7}px !important;
 // }

 // .CodeMirror-gutter, CodeMirror-linenumbers {
 //    margin-left: ${size * 5 / 7}px !important;
 // }
`;

var style;
function initFontSize(height) {
    style = document.createElement("style");
    style.type = "text/css";
    setFontSize(12, height);
    document.getElementsByTagName("head")[0].appendChild(style);
}

function setFontSize(size, height) {
    const styleSheet = createSheet(size, height);
    if (style.styleSheet) {
        style.styleSheet.cssText = styleSheet;
    } else {
        style.innerHTML = "";
        style.appendChild(document.createTextNode(styleSheet));
    }
}

console.time("perf");
console.timeEnd("perf");

const { Header, Content, Footer, Sider } = Layout;
const SubMenu = Menu.SubMenu;

class App extends React.Component {
    constructor() {
        super();
        const defaultState = {
            code: "",
            showInitCode: false,
            prettyCode: false,
            fontSize: 12,
            "side-by-side": true,

            "existential-operator": false,
            decorator: false,
            do: false,
            "flatmap-operator": false,
            jsx: false,
            layer: false,
            pipeline: false,
            "try-catch-operator": false,
            "operator-overloading": false,
            macro: false,
            flow: false,
            uncertainty: false,
            unit: false,
            sqlJs: false
        };

        const storedState =
            JSON.parse(localStorage.getItem("langua-state")) || defaultState;
        this.state = storedState;

        initFontSize(this.state["side-by-side"] ? 100 : 50);

        this.compile = _.debounce(() => {
            console.time("getCompilationFunction");
            const transformFn = getCompilationFunction(
                extensions.filter(e => this.state[e])
            );
            console.timeEnd("getCompilationFunction");

            console.time("transformFn");
            let compiledCode;
            const initToken = ";\n//###init-code###\n";
            try {
                compiledCode = transformFn(this.state.code);
            } catch (ex) {
                compiledCode = initToken + "COULD NOT PARSE!" + ex.msg;
            }
            console.timeEnd("transformFn");

            if (this.state.showInitCode) {
                compiledCode = compiledCode.replace(initToken, "\n\n");
            } else {
                compiledCode = compiledCode.split(initToken)[1];
            }

            if (this.state.prettyCode) {
                try {
                    compiledCode = format.format(compiledCode);
                } catch (ex) {}
            }

            this.setState({
                compiledCode
            });
        }, 500);
    }

    updateCode(editor, data, newCode) {
        console.log("updateCode", newCode);
        this.setState({
            code: newCode
        });
        this.compile();
    }
    changeCheckbox(setting) {
        const newValue = !this.state[setting];
        if (setting === "side-by-side") {
            setFontSize(this.state.fontSize, newValue ? 100 : 50);
        }
        this.setState({
            [setting]: newValue
        });
        this.compile();
    }

    componentDidUpdate() {
        localStorage.setItem("langua-state", JSON.stringify(this.state));
    }

    render() {
        var options = {
            // lineNumbers: true,
            mode: "jsx"
        };

        const checkboxes = extensions.map(e =>
            <div>
                <Checkbox
                    key={e}
                    checked={this.state[e]}
                    onChange={this.changeCheckbox.bind(this, e)}
                    style={{
                        color: "rgba(255, 255, 255, 0.65)",
                        marginBottom: 10
                    }}
                >
                    {e}
                </Checkbox>
            </div>
        );

        return (
            <Layout style={{ minHeight: "100vh" }}>
                <Sider>
                    <Icon
                        type="rocket"
                        style={{ fontSize: 32, color: "white", marginLeft: 9 }}
                    />
                    <span
                        style={{
                            fontSize: 32,
                            color: "white",
                            marginLeft: 5,
                            fontFamily: "'Poiret One', cursive",
                            fontWeight: "bold"
                        }}
                    >
                        LANGUA
                    </span>
                    <Menu
                        theme="dark"
                        // defaultSelectedKeys={["1"]}
                        mode="inline"
                    >
                        <Menu.Item key="1">
                            <Icon type="appstore-o" style={{ fontSize: 16 }} />
                            <span>Extensions</span>
                        </Menu.Item>
                        <div style={{ marginLeft: 24 }}>{checkboxes}</div>
                        <Menu.Item key="2" style={{ marginTop: 20 }}>
                            <Icon type="tool" style={{ fontSize: 16 }} />
                            <span>Options</span>
                        </Menu.Item>
                        <div style={{ marginLeft: 24 }}>
                            <div>
                                <Checkbox
                                    checked={this.state["side-by-side"]}
                                    onChange={this.changeCheckbox.bind(
                                        this,
                                        "side-by-side"
                                    )}
                                    style={{
                                        color: "rgba(255, 255, 255, 0.65)",
                                        marginBottom: 10
                                    }}
                                >
                                    Side by side
                                </Checkbox>
                            </div>
                            <div>
                                <Checkbox
                                    checked={this.state["showInitCode"]}
                                    onChange={this.changeCheckbox.bind(
                                        this,
                                        "showInitCode"
                                    )}
                                    style={{
                                        color: "rgba(255, 255, 255, 0.65)",
                                        marginBottom: 10
                                    }}
                                >
                                    Show Init Code
                                </Checkbox>
                            </div>
                            <div>
                                <Checkbox
                                    checked={this.state["prettyCode"]}
                                    onChange={this.changeCheckbox.bind(
                                        this,
                                        "prettyCode"
                                    )}
                                    style={{
                                        color: "rgba(255, 255, 255, 0.65)",
                                        marginBottom: 10
                                    }}
                                >
                                    Pretty Output
                                </Checkbox>
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <p>Font size:</p>
                                <Slider
                                    defaultValue={12}
                                    onAfterChange={size =>
                                        setFontSize(
                                            size,
                                            this.state["side-by-side"]
                                                ? 100
                                                : 50
                                        )}
                                />
                            </div>
                        </div>
                    </Menu>
                </Sider>
                <Layout>
                    <Content>

                        <Row>
                            <Col span={this.state["side-by-side"] ? 12 : 24}>
                                <CodeMirror
                                    value={this.state.code}
                                    onBeforeChange={this.updateCode.bind(this)}
                                    options={options}
                                />
                            </Col>
                            <Col span={this.state["side-by-side"] ? 12 : 24}>
                                <CodeMirror
                                    value={this.state.compiledCode}
                                    onBeforeChange={(a, b, c) =>
                                        this.setState({ compiledCode: c })}
                                    options={options}
                                />
                            </Col>
                        </Row>
                    </Content>
                </Layout>
            </Layout>
        );
    }
}

render(<App />, document.getElementById("main"));
