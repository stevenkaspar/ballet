// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class CurrencyCardLink extends Component {

  render() {
    return (
      <div className='currency-card-link p-2'>
        <div className='currency-card-link-wrapper p-2'>
          <Link to={this.props.to}>
            {this.props.link_text}
          </Link>
        </div>
      </div>
    )
  }
}
