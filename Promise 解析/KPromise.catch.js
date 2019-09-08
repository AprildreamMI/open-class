class KPromise {
  // 进行中状态
  static PENDING = 'PENDING'
  // 完成
  static RESOLVED = 'RESOLVED'
  // 失败
  static REJECTED = 'REJECTED'
  constructor (handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('传入参数不是一个方法')
    }

    // 定义一个数组 存储成功函数队列
    this.resolveQueues = []
    // 定义一个数组 存储失败函数队列
    this.rejectQueues = []

    // 改变状态为进行中
    this.status = KPromise.PENDING

    // 传入方法
    handler(this._resolve.bind(this), this._reject.bind(this))
  }

  // 完成方法
  _resolve (res) {
    // 把方法的执行放在异步线程中的微任务中
    // 防止外部调用的时候根本不是一个异步的函数 从而不会执行then中的把函数加载入队列中的方法
    addEventListener('message', () => {
      if (this.status !== KPromise.PENDING ) return
      // 改变状态
      this.status = KPromise.RESOLVED
      let handler
      // 弹出队列中的一个函数 并删除它
      while(handler = this.resolveQueues.shift()) {
        // 执行
        handler(res)
      }
    })
    // 立即触发
    postMessage('')
  }
 
  // 失败方法
  _reject (err) {
    addEventListener('message', () => {
      if (this.status !== KPromise.PENDING ) return 
      // 改变状态
      this.status = KPromise.REJECTED
      let handler
      // 弹出队列中的一个函数 并删除它
      while(handler = this.rejectQueues.shift()) {
        /**
         * 真正执行在这里执行的
         * then 只不过把回调加入函数队列里面 然后循环队列 执行函数
         */
        // 执行
        handler(err)
      }
    })
    // 立即触发
    postMessage('')
  }

  catch (rejectHandler) {
    return this.then(, rejectHandler)
  }
  
  // 把外部的回调函数加入函数队列中 然后在异步方法好了后 循环函数队列  进行执行
  then (resolveHandler, rejectHandler) {
    // this.resolveQueues.push(resolveHandler)
    // this.rejectQueues.push(rejectHandler)

    // 可以连续.then()
    return new KPromise((resolve, reject) => {
      // 执行原来的resolved 和 新的
      function newResolvedHandler (res) {
        // 接受返回值
        let result = resolveHandler(res)
        // 如果返回值还是一个KPromise 的实列的话
        if (result instanceof KPromise) {
          // 把返回的KPromise 的resolve 执行时机 放在此KPromise的resolve执行时 循环它的函数数组执行里面的函数时
          // 并传递参数给当前的 resolve 
          result.then(resolve, reject)
        } else {
          resolve(result)
        }
      }
      // 执行原来的reject和 当前的reject
      function newRejectHandler (err) {
        let result = rejectHandler(err)
        reject(result)
      }

      this.resolveQueues.push(newResolvedHandler)
      this.rejectQueues.push(newRejectHandler)
    })

  }
}