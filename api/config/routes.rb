Rails.application.routes.draw do

  resources :tasks, only: [:create] do
    put :finish, on: :member, via: :put
  end

  mount_ember_app :ui, to: '/'

end
