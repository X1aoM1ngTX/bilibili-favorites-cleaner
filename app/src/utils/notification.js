import { notification } from 'ant-design-vue'

export const useNotification = () => {
  const success = (message, description = '', duration = 3) => {
    notification.success({
      message,
      description,
      duration,
      placement: 'topRight'
    })
  }

  const error = (message, description = '', duration = 4.5) => {
    notification.error({
      message,
      description,
      duration,
      placement: 'topRight'
    })
  }

  const warning = (message, description = '', duration = 4.5) => {
    notification.warning({
      message,
      description,
      duration,
      placement: 'topRight'
    })
  }

  const info = (message, description = '', duration = 3) => {
    notification.info({
      message,
      description,
      duration,
      placement: 'topRight'
    })
  }

  const open = (message, description = '', duration = 4.5) => {
    notification.open({
      message,
      description,
      duration,
      placement: 'topRight'
    })
  }

  const destroy = () => {
    notification.destroy()
  }

  return {
    success,
    error,
    warning,
    info,
    open,
    destroy
  }
}