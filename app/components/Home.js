// @flow
import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { replace } from 'react-router-redux'

import { Form, FormGroup, Input, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'

import bitcoin from 'bitcoinjs-lib'

import { user, addresses } from '../services'

export default class Home extends Component {
  constructor(){
    super()

    this.state = {
      show_welcome_modal: false,
      loading:            true,
      welcome_form: {
        private_key:    '',
        public_address: '',
        error_message:  '',
        is_submitting:  false
      }
    }

    this.handlePrivateKeyChange = this.handlePrivateKeyChange.bind(this)
    this.generatePrivateKey     = this.generatePrivateKey.bind(this)
    this.handleWelcomeSubmit    = this.handleWelcomeSubmit.bind(this)

    this.getState()
  }

  getState(){

    user.get(`has_setup`).then(user_has_setup => {
      if(!user_has_setup){
        this.setState({
          show_welcome_modal: true,
          loading:            false
        })
      }
      else {
        this.setLocationToDashboard()
      }
    })

  }

  handlePrivateKeyChange(event){
    const new_private_key = event.target.value
    try {
      const key_pair = bitcoin.ECPair.fromWIF(new_private_key)

      this.setState({
        welcome_form: {
          ...this.state.welcome_form,
          private_key:    new_private_key,
          public_address: key_pair.getAddress(),
          error_message:  ''
        }
      })
    }
    catch(e){

      this.setState({
        welcome_form: {
          ...this.state.welcome_form,
          private_key:    new_private_key,
          public_address: '',
          error_message:  e.message
        }
      })
    }
  }

  generatePrivateKey(){
    const key_pair = bitcoin.ECPair.makeRandom()

    this.setState({
      welcome_form: {
        ...this.state.welcome_form,
        private_key:    key_pair.toWIF(),
        public_address: key_pair.getAddress(),
        error_message:  ''
      }
    })
  }

  handleWelcomeSubmit(event){
    event.preventDefault()

    if(this.state.welcome_form.public_address.length === 0){
      this.setState({
        welcome_form: {
          ...this.state.welcome_form,
          error_message: 'Please enter a valid Private Key'
        }
      })
    }
    else {
      if(this.state.welcome_form.is_submitting){
        return
      }
      this.setState({
        welcome_form: {
          ...this.state.welcome_form,
          is_submitting: true
        }
      })
      let promises = []

      promises.push(user.set('has_setup', true))

      promises.push(addresses.add({
        private_key:    this.state.welcome_form.private_key,
        public_address: this.state.welcome_form.public_address
      }))

      Promise.all(promises).then(results => {
        console.log(results)
        this.setLocationToDashboard()
      })
    }

  }

  setLocationToDashboard(){
    this.props.store.dispatch(replace('/dashboard/bitcoin'))
  }

  render() {
    if(this.state.loading){
      return (
        <div className='absolute-full'>
          loading home...
        </div>
      )
    }

    if(this.state.show_welcome_modal){
      return (
        <Modal isOpen={this.state.show_welcome_modal}>
          <ModalHeader>Welcome to Ballet</ModalHeader>
          <ModalBody>
            <Form onSubmit={this.handleWelcomeSubmit}>
              <FormGroup>
                <Label for='private_key'>Private Key</Label>
                <Input type='password' name='private_key' placeholder='Paste Private Key Here' onChange={this.handlePrivateKeyChange} value={this.state.welcome_form.private_key} />
              </FormGroup>
              <FormGroup>
                <Label for='public_address'>Public Address</Label>
                <Input type='text' name='public_address' value={this.state.welcome_form.public_address} disabled={true}/>
              </FormGroup>
              <div className='bg-danger text-white'>
                {
                  this.state.welcome_form.error_message.length > 0 ?
                    <div className='p-2'>{this.state.welcome_form.error_message}</div>
                  : null
                }
              </div>
              <Button className='my-2' block={true} color={'success'} size='lg' disabled={(this.state.welcome_form.public_address.length === 0) || this.state.welcome_form.is_submitting}>Start Using Bitcoin</Button>
            </Form>
            <hr/>
            <div>
              <Button className='my-2' onClick={this.generatePrivateKey} block={true} color={'dark'} size='lg'>Generate Private Key</Button>
            </div>
          </ModalBody>
        </Modal>
      )
    }

    return (
      <div className='absolute-full'>
        done loading home
      </div>
    )
  }
}
