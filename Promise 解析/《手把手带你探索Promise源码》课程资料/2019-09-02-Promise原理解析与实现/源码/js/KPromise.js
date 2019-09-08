class KPromise {

    static PENDING = 'PENDING';
    static RESOLVED = 'RESOLVED';
    static REJECTED = 'REJECTED';

    constructor( handler ) {

        if ( typeof handler !== 'function' ) throw new TypeError('Promise resolver undefined is not a function');

        this.resolvedQueues = [];
        this.rejectedQueues = [];
        this.finayllyQueues = [];

        this.status = KPromise.PENDING;
        this.value;

        handler( this._resolve.bind(this), this._reject.bind(this) );

    }

    _resolve(val) {
        // setTimeout(_=>{
            
        // }, 0);

        window.addEventListener('message', _=>{
            if (this.status !== KPromise.PENDING) return; 
            // console.log('_resolve');
            this.status = KPromise.RESOLVED;
            this.value = val;

            let handler;
            while( handler = this.resolvedQueues.shift() ) {
                handler(this.value);
            }
            this._finally(this.value);
        });
        window.postMessage('');
    }

    _reject(val) {
        // setTimeout(_=>{
            
        // }, 0);

        window.addEventListener('message', _=>{
            if (this.status !== KPromise.PENDING) return;
            this.status = KPromise.REJECTED;
            this.value = val;

            let handler;
            while( handler = this.rejectedQueues.shift() ) {
                handler(this.value);
            }
            this._finally(this.value);
        });
        window.postMessage('');
    }

    _finally() {
        window.addEventListener('message', _=>{
            this.status = KPromise.REJECTED;

            let handler;
            while( handler = this.finayllyQueues.shift() ) {
                handler(this.value);
            }
        });
        window.postMessage('');
    }

    then( resolvedHandler, rejectedHandler ) {
        // resolvedHandler();

        // 事件 

        // this.resolvedQueues.push(resolvedHandler);
        // this.rejectedQueues.push(rejectedHandler);

        return new KPromise( (resolve, reject) => {
            // resolve();

            function newResolvedHandler(val) {
                if (typeof resolvedHandler === 'function') {
                    let result = resolvedHandler(val);

                    if (result instanceof KPromise) {
                        result.then(resolve, reject);
                    } else {
                        resolve(result);
                    }
                } else {
                    resolve(val);
                }
            }
            function newRejectedHandler(val) {
                if (typeof rejectedHandler === 'function') {
                    let result = rejectedHandler(val);
                    if (result instanceof KPromise) {
                        result.then(resolve, reject);
                    } else {
                        reject(result);
                    }
                } else {
                    reject(val);
                }
            }

            this.resolvedQueues.push(newResolvedHandler);
            this.rejectedQueues.push(newRejectedHandler);

        } );
    }

    catch(rejectedHandler) {
        return this.then(undefined, rejectedHandler);
    }

    finally(finallyHandler) {
        this.finayllyQueues.push(finallyHandler);
    }


    static resolve(val) {
        return new Promise(resolve => {
            resolve(val);
        });
    }

    static reject(val) {
        return new Promise((resolve, reject) => {
            reject(val);
        });
    }

    static all(iterator) {

        let len = iterator.length;
        let i = 0;
        let vals = [];

        return new KPromise( (resolve, reject) => {
            iterator.forEach(it => {
                it.then(val => {
                    i++;
                    vals.push(val);
                    if (i === len) {
                        resolve(vals);
                    }
                }).catch(e=> {
                    reject(e);
                });
            });
        } );

    }

    static race(iterator) {
        return new KPromise((resolve, reject) => {
            iterator.forEach(it => {
                it.then(val => {
                    resolve(val);
                }).catch(e=> {
                    reject(e);
                });
            });
        })
    }

    static allSettled(iterator) {
        let len = iterator.length;
        let i = 0;
        let vals = [];

        return new KPromise( (resolve, reject) => {
            iterator.forEach(it => {
                it.finally(val => {
                    i++;
                    vals.push(val);
                    if (i === len) {
                        resolve(vals);
                    }
                }).catch(e=>{})
            });
        } );
    }

}