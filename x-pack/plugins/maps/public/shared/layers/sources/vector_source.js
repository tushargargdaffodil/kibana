/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */


import { VectorLayer } from '../vector_layer';
import { VectorStyle } from '../styles/vector_style';
import { AbstractSource } from './source';
import * as topojson from 'topojson-client';
import _ from 'lodash';
import { i18n } from '@kbn/i18n';

export class AbstractVectorSource extends AbstractSource {

  static async getGeoJson({ format, featureCollectionPath, fetchUrl }) {
    let fetchedJson;
    try {
      // TODO proxy map.regionmap url requests through kibana server and then use kfetch
      // Can not use kfetch because fetchUrl may point to external URL. (map.regionmap)
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error('Request failed');
      }
      fetchedJson = await response.json();
    } catch (e) {
      throw new Error(i18n.translate('xpack.maps.source.vetorSource.requestFailedErrorMessage', {
        defaultMessage: `Unable to fetch vector shapes from url: {fetchUrl}`,
        values: { fetchUrl }
      }));
    }

    if (format === 'geojson') {
      return fetchedJson;
    }

    if (format === 'topojson') {
      const features = _.get(fetchedJson, `objects.${featureCollectionPath}`);
      return topojson.feature(fetchedJson, features);
    }

    throw new Error(i18n.translate('xpack.maps.source.vetorSource.formatErrorMessage', {
      defaultMessage: `Unable to fetch vector shapes from url: {format}`,
      values: { format }
    }));
  }

  _createDefaultLayerDescriptor(options, mapColors) {
    return VectorLayer.createDescriptor(
      {
        sourceDescriptor: this._descriptor,
        ...options
      },
      mapColors);
  }

  createDefaultLayer(options, mapColors) {
    const layerDescriptor = this._createDefaultLayerDescriptor(options, mapColors);
    const style = new VectorStyle(layerDescriptor.style);
    return new VectorLayer({
      layerDescriptor: layerDescriptor,
      source: this,
      style: style
    });
  }

  isFilterByMapBounds() {
    return false;
  }

  isBoundsAware() {
    return false;
  }

  async getBoundsForFilters() {
    console.warn('Should implement AbstractVectorSource#getBoundsForFilters');
    return null;
  }

  async getNumberFields() {
    return [];
  }

  async getStringFields() {
    return [];
  }

  async getGeoJsonWithMeta() {
    throw new Error('Should implement VectorSource#getGeoJson');
  }

  canFormatFeatureProperties() {
    return false;
  }

  // Allow source to filter and format feature properties before displaying to user
  async filterAndFormatProperties(properties) {
    //todo :this is quick hack... should revise (should model proeprties explicitly in vector_layer
    const props = {};
    for (const key in properties) {
      if (key.startsWith('__kbn')) {//these are system properties and should be ignored
        continue;
      }
      props[key] = properties[key];
    }
    return props;
  }

  async isTimeAware() {
    return false;
  }

  isJoinable() {
    return true;
  }
}
