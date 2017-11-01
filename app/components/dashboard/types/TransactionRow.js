import React, { Component } from 'react'
import { Container, Row, Col, ButtonGroup, Button } from 'reactstrap'

import moment  from 'moment'

export default class TransactionRow extends Component {
  render(){
    const color = this.props.change > 0 ? 'success' : (this.props.change === 0) ? 'dark' : 'danger'
    return (
      <Row key={this.props.tx.hash} className='py-2'>
        <Col xs={9} md={8}>
          <span className='text-primary word-break-all'>
            {this.props.tx.hash}
          </span>
          <br/>
          <span className='text-muted'>
            {moment.unix(this.props.tx.time).format('YYYY-M-D h:mm a')}
          </span>
        </Col>
        <Col xs={3} md={2} className={`text-${color} text-right`}>
          {this.props.change}
        </Col>
        <Col xs={3} md={2} className='d-none d-md-block text-right'>
          {this.props.remaining}
        </Col>
      </Row>
    )
  }
}
