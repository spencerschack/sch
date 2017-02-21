class TaskResource < JSONAPI::Resource

  include RangeResource
  include UserOwnedResource

  attributes :name

  has_one :project, always_include_linkage_data: true

end
