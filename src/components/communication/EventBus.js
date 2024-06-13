const eventBus = {
    on(event, callback, id) {
        if(typeof document == `undefined`)
            return;
        var eventId = event
        if(typeof id != `undefined`)
            eventId = event +'.'+id
        this.off(event, callback, id);
        document.addEventListener(eventId, (e) => callback(e.detail));
    },
    dispatch(event, data, id) {
        if(typeof document == `undefined`)
            return;
        var eventId = event
        if(typeof id != `undefined`)
            eventId = event +'.'+id
        document.dispatchEvent(new CustomEvent(eventId, { detail: data }));
    },
    off(event, callback, id) {
        if(typeof document == `undefined`)
            return;
        var eventId = event
        if(typeof id != `undefined`)
            eventId = event +'.'+id
        document.removeEventListener(eventId, callback);
    },
};

export default eventBus;