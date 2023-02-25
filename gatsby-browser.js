import eventBus from './src/components/communication/EventBus';

export const onInitialClientRender = () => {
    setTimeout(function() {
        eventBus.dispatch("onInitialClientRender")
    }, 200)
}

export const onClientEntry = () => {
    window.onload = () => { 
        eventBus.dispatch("onInitialClientRender")
     }
  }
  