class ProjectResource < JSONAPI::Resource

  include UserOwnedResource

  attributes :name

  has_one :parent, always_include_linkage_data: true, class_name: 'Project'
  has_many :children

end
