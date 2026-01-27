<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="location-picker-overlay" @click.self="handleClose">
        <div class="location-picker-modal">
          <div class="picker-header">
            <h3>选择位置</h3>
            <button class="close-btn" @click="handleClose">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          <div class="picker-body">
            <div class="search-bar">
              <input 
                v-model="searchKeyword" 
                type="text" 
                placeholder="搜索地点..."
                @keydown.enter="handleSearch"
              />
              <button class="search-btn" @click="handleSearch">搜索</button>
            </div>
            
            <div class="map-container" ref="mapContainer"></div>
            
            <div class="location-info" v-if="selectedLocation">
              <div class="location-name">{{ selectedLocation.name }}</div>
              <div class="location-address">{{ selectedLocation.address }}</div>
            </div>
          </div>
          
          <div class="picker-footer">
            <button class="locate-btn" @click="handleLocate" :disabled="locating">
              <svg v-if="!locating" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
              <span v-else>定位中...</span>
              <span v-if="!locating">定位到当前位置</span>
            </button>
            <button class="confirm-btn" @click="handleConfirm" :disabled="!selectedLocation">
              确认选择
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'

const props = defineProps({
  visible: Boolean,
  initialLocation: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'select'])

const mapContainer = ref(null)
const searchKeyword = ref('')
const locating = ref(false)
const selectedLocation = ref(null)
let map = null
let marker = null
let geocoder = null
let placeSearch = null


const initMap = async () => {
  try {
    console.log('开始初始化地图...')
    
    if (!mapContainer.value) {
      console.error('mapContainer 不存在')
      return
    }
    // 关键！设置安全密钥[1,5](@ref)
    window._AMapSecurityConfig = {
      securityJsCode: import.meta.env.VITE_AMAP_SECURITY_JS_CODE
    };
    console.log('mapContainer 存在，开始加载高德地图 API...')
    console.log('API Key:', import.meta.env.VITE_AMAP_KEY)
    
    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Geocoder', 'AMap.PlaceSearch']
    }).then((AMap) => {
      console.log('高德地图 API 加载成功，开始初始化地图实例')
      initMapInstance(AMap)
    })
  } catch (error) {
    console.error('地图初始化失败:', error)
    alert('地图初始化失败，请检查网络连接或刷新页面重试')
  }
}

const initMapInstance = (AMap) => {
  console.log('开始初始化地图实例...')
  console.log('mapContainer:', mapContainer.value)
  
  map = new AMap.Map(mapContainer.value, {
    zoom: 13,
    center: [116.397428, 39.90923],
    viewMode: '2D'
  })
  
  console.log('地图实例创建成功')
  
  geocoder = new AMap.Geocoder({
    city: '全国',
    radius: 1000
  })
  
  console.log('Geocoder 创建成功')
  
  placeSearch = new AMap.PlaceSearch({
    city: '全国',
    pageSize: 10,
    pageIndex: 1
  })
  
  console.log('PlaceSearch 创建成功')
  
  map.on('click', handleMapClick)
  console.log('地图点击事件已绑定')
  
  if (props.initialLocation && props.initialLocation.lng && props.initialLocation.lat) {
    map.setCenter([props.initialLocation.lng, props.initialLocation.lat])
    map.setZoom(15)
    updateMarker(props.initialLocation.lng, props.initialLocation.lat)
    updateSelectedLocation(props.initialLocation.lng, props.initialLocation.lat, props.initialLocation.name || '', geocoder)
  } else {
    setTimeout(() => {
      handleLocate()
    }, 500)
  }
  
  console.log('地图初始化完成')
}

const handleMapClick = (e) => {
  const { lng, lat } = e.lnglat
  updateMarker(lng, lat)
  
  if (geocoder) {
    updateSelectedLocation(lng, lat, '', geocoder)
  } else {
    selectedLocation.value = {
      lng,
      lat,
      name: `${lng.toFixed(6)}, ${lat.toFixed(6)}`,
      address: '点击地图选择位置'
    }
  }
}

const updateMarker = (lng, lat) => {
  if (marker) {
    marker.setPosition([lng, lat])
  } else {
    marker = new AMap.Marker({
      position: [lng, lat],
      map: map,
      animation: 'AMAP_ANIMATION_DROP'
    })
  }
}

const updateSelectedLocation = (lng, lat, name = '') => {
  console.log('开始地理编码:', lng, lat, name)
  
  if (!geocoder) {
    console.error('Geocoder 未初始化')
    selectedLocation.value = {
      lng,
      lat,
      name: name || '未知位置',
      address: '地理编码服务未就绪'
    }
    return
  }
  
  geocoder.getAddress([lng, lat], (status, result) => {
    console.log('地理编码结果:', status, result)
    
    if (status === 'complete' && result.regeocode) {
      const regeocode = result.regeocode
      let address = regeocode.formattedAddress
      
      if (!address && regeocode.addressComponent) {
        const ac = regeocode.addressComponent
        address = [ac.province, ac.city, ac.district, ac.township, ac.street]
          .filter(Boolean)
          .join('')
      }
      
      selectedLocation.value = {
        lng,
        lat,
        name: name || address || '未知位置',
        address: address || '未知地址'
      }
    } else {
      console.error('地理编码失败:', status, result)
      selectedLocation.value = {
        lng,
        lat,
        name: name || '未知位置',
        address: '无法获取地址信息'
      }
    }
  })
}

const handleSearch = () => {
  if (!searchKeyword.value.trim() || !placeSearch) return
  
  placeSearch.search(searchKeyword.value, (status, result) => {
    if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
      const poi = result.poiList.pois[0]
      const { location } = poi
      
      map.setCenter([location.lng, location.lat])
      map.setZoom(15)
      updateMarker(location.lng, location.lat)
      
      selectedLocation.value = {
        lng: location.lng,
        lat: location.lat,
        name: poi.name,
        address: poi.address || poi.pname + poi.cityname + poi.adname || '搜索结果'
      }
    } else {
      alert('未找到相关地点')
    }
  })
}

const handleLocate = () => {
  locating.value = true
  
  if (!map) {
    locating.value = false
    alert('地图未加载完成，请稍后再试')
    return
  }
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locating.value = false
        const { latitude, longitude } = position.coords
        
        map.setCenter([longitude, latitude])
        map.setZoom(15)
        updateMarker(longitude, latitude)
        
        if (geocoder) {
          geocoder.getAddress([longitude, latitude], (status, result) => {
            if (status === 'complete' && result.regeocode) {
              const regeocode = result.regeocode
              let address = regeocode.formattedAddress
              
              if (!address && regeocode.addressComponent) {
                const ac = regeocode.addressComponent
                address = [ac.province, ac.city, ac.district, ac.township, ac.street]
                  .filter(Boolean)
                  .join('')
              }
              
              selectedLocation.value = {
                lng: longitude,
                lat: latitude,
                name: address || '当前位置',
                address: address || '未知地址'
              }
            } else {
              selectedLocation.value = {
                lng: longitude,
                lat: latitude,
                name: `${longitude.toFixed(6)}, ${latitude.toFixed(6)}`,
                address: '当前位置'
              }
            }
          })
        } else {
          selectedLocation.value = {
            lng: longitude,
            lat: latitude,
            name: `${longitude.toFixed(6)}, ${latitude.toFixed(6)}`,
            address: '当前位置'
          }
        }
      },
      (error) => {
        locating.value = false
        console.error('浏览器定位失败:', error)
        alert('定位失败，请手动选择位置')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    )
  } else {
    locating.value = false
    alert('您的浏览器不支持定位功能，请手动选择位置')
  }
}

const handleConfirm = () => {
  if (selectedLocation.value) {
    emit('select', selectedLocation.value)
    handleClose()
  }
}

const handleClose = () => {
  emit('close')
}

onMounted(() => {
  if (props.visible) {
    nextTick(() => {
      initMap()
    })
  }
})

onBeforeUnmount(() => {
  if (map) {
    map.destroy()
    map = null
  }
})
</script>

<style scoped>
.location-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.location-picker-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.picker-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: #666;
}

.close-btn:hover {
  background: #eee;
  transform: rotate(90deg);
}

.picker-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  overflow: hidden;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-bar input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: #fafafa;
}

.search-bar input:focus {
  outline: none;
  border-color: #7d8a9a;
  background: white;
  box-shadow: 0 0 0 3px rgba(125, 138, 154, 0.1);
}

.search-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #7d8a9a 0%, #9a8c7c 100%);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(125, 138, 154, 0.3);
}

.map-container {
  flex: 1;
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.location-info {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(125, 138, 154, 0.05);
  border-radius: 8px;
  border-left: 3px solid #7d8a9a;
}

.location-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.location-address {
  font-size: 13px;
  color: #666;
}

.picker-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
}

.locate-btn {
  flex: 1;
  padding: 12px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.locate-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.locate-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.confirm-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #7d8a9a 0%, #9a8c7c 100%);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(125, 138, 154, 0.3);
}

.confirm-btn:disabled {
  background: #ddd;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .location-picker-modal,
.modal-leave-to .location-picker-modal {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

.modal-enter-active .location-picker-modal,
.modal-leave-active .location-picker-modal {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
