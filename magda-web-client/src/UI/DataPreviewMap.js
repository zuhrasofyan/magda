import React, { Component } from "react";
import PropTypes from "prop-types";
import memoize from "memoize-one";
import "./DataPreviewMap.css";
import DataPreviewMapOpenInNationalMapButton from "./DataPreviewMapOpenInNationalMapButton";
import { config } from "../config";
import { Medium, Small } from "./Responsive";
import Spinner from "../Components/Spinner";

export const defaultDataSourcePreference = [
    "WMS",
    "ESRI REST",
    "GeoJSON",
    "WFS",
    "csv-geo-au",
    "KML"
];

export const isSupportedFormat = function(format) {
    return (
        defaultDataSourcePreference
            .map(item => item.toLowerCase())
            .filter(item => format.trim() === item).length !== 0
    );
};

// React 16.3 advice for replacing prop -> state updates for computations
const determineDistribution = memoize(function determineDistribution(
    distributions,
    dataSourcePreference
) {
    if (!dataSourcePreference || !dataSourcePreference.length)
        dataSourcePreference = defaultDataSourcePreference;
    dataSourcePreference = dataSourcePreference.map(item => item.toLowerCase());
    if (!distributions || !distributions.length) return null;
    let selectedDis = null,
        perferenceOrder = -1;
    distributions
        .filter(
            item =>
                (item.linkStatusAvailable && item.linkActive) ||
                !item.linkStatusAvailable
        )
        .forEach(dis => {
            const format = dis.format.toLowerCase();
            const distributionPerferenceOrder = dataSourcePreference.indexOf(
                format
            );
            if (distributionPerferenceOrder === -1) return;
            if (
                perferenceOrder === -1 ||
                distributionPerferenceOrder < perferenceOrder
            ) {
                perferenceOrder = distributionPerferenceOrder;
                selectedDis = dis;
                return;
            }
        });
    return selectedDis;
});

class DataPreviewMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            isMapInteractive: false
        };
        this.onIframeMessageReceived = this.onIframeMessageReceived.bind(this);
        this.iframeRef = React.createRef();
        this.handleMapClick = evt => {
            this.setState({ isMapInteractive: true });
        };
        this.handleMapMouseLeave = evt => {
            this.setState({ isMapInteractive: false });
        };
    }

    componentDidMount() {
        window.addEventListener("message", this.onIframeMessageReceived);
    }
    componentDidUpdate(prevProps, prevState) {
        if (this.props.distributions !== prevProps.distributions) {
            if (!this.props.distributions || !this.props.distributions.length) {
                this.setState({
                    loaded: false
                });
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener("message", this.onIframeMessageReceived);
    }

    createCatalogItemFromDistribution(selectedDistribution) {
        return {
            initSources: [
                {
                    catalog: [
                        {
                            name: selectedDistribution.title,
                            type: "magda-item",
                            url: config.baseUrl,
                            distributionId: selectedDistribution.identifier,
                            isEnabled: true,
                            zoomOnEnable: true
                        }
                    ],
                    baseMapName: "Positron (Light)",
                    homeCamera: {
                        north: -8,
                        east: 158,
                        south: -45,
                        west: 109
                    }
                }
            ]
        };
    }

    onIframeMessageReceived(e) {
        const selectedDistribution = determineDistribution(
            this.props.distributions,
            this.props.dataSourcePreference
        );

        if (!selectedDistribution || !this.iframeRef.current) return;
        const iframeWindow = this.iframeRef.current.contentWindow;
        if (iframeWindow !== e.source) return;
        if (e.data === "ready") {
            iframeWindow.postMessage(
                this.createCatalogItemFromDistribution(selectedDistribution),
                "*"
            );
            this.setState({
                loaded: false
            });
            if (this.props.onLoadingStart) {
                try {
                    this.props.onLoadingStart();
                } catch (e) {
                    console.log(e);
                }
            }
            return;
        } else if (e.data === "loading complete") {
            this.setState({
                loaded: true
            });
            if (this.props.onLoadingEnd) {
                try {
                    this.props.onLoadingEnd();
                } catch (e) {
                    console.log(e);
                }
            }
            return;
        }
    }

    render() {
        const selectedDistribution = determineDistribution(
            this.props.distributions,
            this.props.dataSourcePreference
        );

        if (!selectedDistribution) return null; // hide the section if no data available

        // 3 states:
        // - loading component (isInitLoading === true) -> Show spinner
        // - loading terria (isMapLoading === true) -> Continue showing spinner and start loading map hidden
        // - everything loaded (neither true) -> No spinner, show map

        return (
            <div>
                <h3>Map Preview</h3>
                <Small>
                    <DataPreviewMapOpenInNationalMapButton
                        distribution={selectedDistribution}
                        style={{
                            position: "relative",
                            top: "10px",
                            visibility: "visible"
                        }}
                        buttonText="View in national map"
                    />
                </Small>
                <Medium>
                    <div
                        className="data-preview-map"
                        onClick={this.handleMapClick}
                        onMouseLeave={this.handleMapMouseLeave}
                    >
                        {!this.state.loaded && (
                            <Spinner width="100%" height="420px" />
                        )}
                        <DataPreviewMapOpenInNationalMapButton
                            distribution={selectedDistribution}
                            buttonText="Open In National Map"
                            style={{
                                position: "absolute",
                                right: "10px",
                                top: "10px",
                                visibility: this.state.isMapLoading
                                    ? "hidden"
                                    : "visible"
                            }}
                        />
                        {selectedDistribution.identifier != null && (
                            <iframe
                                key={selectedDistribution.identifier}
                                title={selectedDistribution}
                                width="100%"
                                height="420px"
                                frameBorder="0"
                                src={
                                    config.previewMapUrl +
                                    "#mode=preview&hideExplorerPanel=1"
                                }
                                ref={this.iframeRef}
                                className={[
                                    !this.state.loaded &&
                                        "data-preview-map-iframe_loading",
                                    !this.state.isMapInteractive &&
                                        "data-preview-map-iframe_no-scroll"
                                ]
                                    .filter(c => !!c)
                                    .join(" ")}
                            />
                        )}
                    </div>
                </Medium>
            </div>
        );
    }
}

DataPreviewMap.propTypes = {
    distributions: PropTypes.arrayOf(PropTypes.object),
    dataSourcePreference: PropTypes.arrayOf(PropTypes.string),
    onLoadingStart: PropTypes.func,
    onLoadingEnd: PropTypes.func
};

export default DataPreviewMap;
